import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from '../utils/base64';

/**
 * Upload a photo to Supabase Storage and create database entry
 */
export async function uploadPhoto(
  imageUri: string,
  caption: string,
  userId: string
) {
  try {
    // 1. Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 2. Generate unique filename
    const fileName = `${userId}_${Date.now()}.jpg`;
    const filePath = `photos/${fileName}`;

    // 3. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rewind-photos')
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 4. Get public URL
    const { data: urlData } = supabase.storage
      .from('rewind-photos')
      .getPublicUrl(filePath);

    // 5. Save to database
    const { data, error } = await supabase
      .from('photos')
      .insert([
        {
          user_id: userId,
          image_url: urlData.publicUrl,
          caption: caption,
          prompt_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { photo: data, error: null };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { photo: null, error };
  }
}

/**
 * Get feed of recent photos
 */
export async function getFeed(limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select(`
        *,
        users (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get likes and comments count for each photo
    const photosWithCounts = await Promise.all(
      (data || []).map(async (photo) => {
        const [likesResult, commentsResult] = await Promise.all([
          supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('photo_id', photo.id),
          supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('photo_id', photo.id),
        ]);

        return {
          ...photo,
          likes_count: likesResult.count || 0,
          comments_count: commentsResult.count || 0,
        };
      })
    );

    return { photos: photosWithCounts, error: null };
  } catch (error) {
    console.error('Error getting feed:', error);
    return { photos: [], error };
  }
}

/**
 * Get photos for a specific user
 */
export async function getUserPhotos(userId: string) {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { photos: data, error: null };
  } catch (error) {
    console.error('Error getting user photos:', error);
    return { photos: [], error };
  }
}

/**
 * Like a photo
 */
export async function likePhoto(photoId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('likes')
      .insert([
        {
          photo_id: photoId,
          user_id: userId,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error liking photo:', error);
    return { error };
  }
}

/**
 * Unlike a photo
 */
export async function unlikePhoto(photoId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('photo_id', photoId)
      .eq('user_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error unliking photo:', error);
    return { error };
  }
}

/**
 * Add a comment to a photo
 */
export async function addComment(photoId: string, userId: string, text: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          photo_id: photoId,
          user_id: userId,
          text: text,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { comment: data, error: null };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { comment: null, error };
  }
}

/**
 * Get comments for a photo
 */
export async function getComments(photoId: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { comments: data, error: null };
  } catch (error) {
    console.error('Error getting comments:', error);
    return { comments: [], error };
  }
}
