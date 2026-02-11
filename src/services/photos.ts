import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from '../utils/base64';
import { shouldSendNotification } from './notificationPreferences';
import { sendPhotoLikedNotification, sendPhotoCommentedNotification, sendFriendPostedNotification } from './notifications';

/**
 * Upload a photo to Supabase Storage and create database entry
 */
export async function uploadPhoto(
  imageUri: string,
  caption: string,
  userId: string,
  photoStyle?: string
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
          photo_style: photoStyle || 'polaroid',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // 6. Notify followers who want friend posted notifications
    // Friend posted notifications handled in CameraScreen to avoid duplicates
    if (data) {
      console.log('✅ Photo uploaded successfully - ID:', data.id);
    }

    return { photo: data, error: null };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { photo: null, error };
  }
}

/**
 * Get feed of recent photos (excludes blocked users)
 */
export async function getFeed(limit: number = 20) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { photos: [], error: 'Not authenticated' };
    }

    // Get list of blocked user IDs
    const { data: blockedData } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    
    const blockedUserIds = blockedData?.map(b => b.blocked_id) || [];

    // Also get users who have blocked current user (mutual block)
    const { data: blockedByData } = await supabase
      .from('blocked_users')
      .select('blocker_id')
      .eq('blocked_id', user.id);
    
    const blockedByUserIds = blockedByData?.map(b => b.blocker_id) || [];

    // Combine both lists
    const allBlockedUserIds = [...new Set([...blockedUserIds, ...blockedByUserIds])];

    // Fetch photos
    let query = supabase
      .from('photos')
      .select(`
        *,
        users!photos_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Exclude blocked users if any
    if (allBlockedUserIds.length > 0) {
      query = query.not('user_id', 'in', `(${allBlockedUserIds.join(',')})`);
    }

    const { data, error } = await query;

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
    console.error('Error getting user photos:', error);
    return { photos: [], error };
  }
}

/**
 * Delete a photo
 */
export async function deletePhoto(photoId: string, userId: string) {
  try {
    // First get the photo to get the image URL
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('image_url')
      .eq('id', photoId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from database (will cascade delete comments and likes)
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Delete from storage
    if (photo?.image_url) {
      const filePath = photo.image_url.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('rewind-photos')
          .remove([`photos/${filePath}`]);
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting photo:', error);
    return { error };
  }
}

/**
 * Like a photo
 */
export async function likePhoto(photoId: string, userId: string) {
  console.log('🚀 likePhoto called:', { photoId, userId });
  
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
    
    console.log('💾 Like saved to database, error:', error);

    if (error) {
      console.log('❌ Error saving like:', error);
      throw error;
    }

    console.log('✅ Like saved successfully, now checking for notifications...');

    // Send notification to photo owner if they have it enabled
    const { data: photoData } = await supabase
      .from('photos')
      .select('user_id')
      .eq('id', photoId)
      .single();

    console.log('📸 Like notification check:', {
      photoOwnerId: photoData?.user_id,
      likerId: userId,
      isSelfLike: photoData?.user_id === userId
    });

    if (photoData && photoData.user_id !== userId) {
      const ownerWantsNotif = await shouldSendNotification(photoData.user_id, 'notif_photo_liked');
      console.log('👤 Photo owner wants like notifications:', ownerWantsNotif);
      
      if (ownerWantsNotif) {
        // Get liker username for notification
        const { data: likerData } = await supabase
          .from('users')
          .select('username')
          .eq('id', userId)
          .single();
        
        if (likerData) {
          console.log('🔔 Sending like notification to photo owner:', photoData.user_id);
          await sendPhotoLikedNotification(photoData.user_id, likerData.username, photoId);
        }
      }
    } else if (photoData?.user_id === userId) {
      console.log('⚠️ Not sending notification - you liked your own photo');
    }

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
    console.log('🔵 Service: addComment called', { photoId, text: text.substring(0, 20) });
    
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

    console.log('✅ Service: Comment created with ID:', data?.id?.substring(0, 8) + '...');

    // Send notification to photo owner if they have it enabled
    if (data) {
      const { data: photoData } = await supabase
        .from('photos')
        .select('user_id')
        .eq('id', photoId)
        .single();

      console.log('💬 Comment notification check:', {
        photoOwnerId: photoData?.user_id,
        commenterId: userId,
        isSelfComment: photoData?.user_id === userId
      });

      if (photoData && photoData.user_id !== userId) {
        const ownerWantsNotif = await shouldSendNotification(photoData.user_id, 'notif_photo_commented');
        console.log('👤 Photo owner wants comment notifications:', ownerWantsNotif);
        
        if (ownerWantsNotif) {
          // Get commenter username for notification
          const { data: commenterData } = await supabase
            .from('users')
            .select('username')
            .eq('id', userId)
            .single();
          
          if (commenterData) {
            console.log('🔔 Sending comment notification to photo owner:', photoData.user_id);
            await sendPhotoCommentedNotification(photoData.user_id, commenterData.username, text, photoId);
          }
        }
      } else if (photoData?.user_id === userId) {
        console.log('⚠️ Not sending notification - you commented on your own photo');
      }
    }

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
    console.log('🔍 Service: getComments called for photo:', photoId.substring(0, 8) + '...');
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users!comments_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    console.log('📊 Service: getComments returned', data?.length, 'comments');
    if (data && data.length > 0) {
      console.log('📋 Service: Comment IDs from DB:', data.map(c => c.id.substring(0, 8) + '...'));
    }
    
    return { comments: data, error: null };
  } catch (error) {
    console.error('Error getting comments:', error);
    return { comments: [], error };
  }
}

/**
 * Check if user has liked a photo
 */
export async function hasUserLikedPhoto(photoId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('photo_id', photoId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return { liked: !!data, error: null };
  } catch (error) {
    console.error('Error checking if user liked photo:', error);
    return { liked: false, error };
  }
}

/**
 * Add a reply to a comment
 */
export async function addCommentReply(
  photoId: string,
  userId: string,
  text: string,
  parentCommentId: string
) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          photo_id: photoId,
          user_id: userId,
          text: text,
          parent_comment_id: parentCommentId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { comment: data, error: null };
  } catch (error) {
    console.error('Error adding comment reply:', error);
    return { comment: null, error };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { error };
  }
}
