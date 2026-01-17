import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Initialize Supabase client with service role key (full access)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in environment variables.');
}

export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Upload image to Supabase Storage
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} bucket - Storage bucket name
 * @param {string} folder - Folder within bucket
 * @param {string} filename - Optional filename (generated if not provided)
 * @returns {Promise<Object>} - Upload result with URL
 */
export async function uploadImage(imageBuffer, bucket = 'rewind-photos', folder = 'photos', filename = null) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Generate unique filename if not provided
    const uniqueFilename = filename || `${Date.now()}-${randomBytes(8).toString('hex')}.jpg`;
    const filePath = `${folder}/${uniqueFilename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`✅ Image uploaded to Supabase: ${filePath}`);

    return {
      path: data.path,
      url: urlData.publicUrl,
      bucket,
    };
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw new Error('Failed to upload image to storage');
  }
}

/**
 * Save photo metadata to database
 * @param {Object} photoData - Photo metadata
 * @returns {Promise<Object>} - Created photo record
 */
export async function savePhotoMetadata(photoData) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('photos')
      .insert({
        user_id: photoData.userId,
        image_url: photoData.imageUrl,
        thumbnail_url: photoData.thumbnailUrl,
        caption: photoData.caption || null,
        prompt_time: photoData.promptTime || new Date().toISOString(),
        photo_style: photoData.photoStyle || 'polaroid',
        latitude: photoData.latitude || null,
        longitude: photoData.longitude || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log(`✅ Photo metadata saved to database: ${data.id}`);

    return data;
  } catch (error) {
    console.error('❌ Error saving photo metadata:', error);
    throw new Error('Failed to save photo metadata');
  }
}

/**
 * Delete image from Supabase Storage
 * @param {string} filePath - File path in storage
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<void>}
 */
export async function deleteImage(filePath, bucket = 'rewind-photos') {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;

    console.log(`✅ Image deleted: ${filePath}`);
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Verify user authentication token
 * @param {string} token - JWT token from Authorization header
 * @returns {Promise<Object>} - User data
 */
export async function verifyAuthToken(token) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    return user;
  } catch (error) {
    console.error('❌ Auth verification failed:', error);
    throw new Error('Authentication failed');
  }
}

export default {
  supabase,
  uploadImage,
  savePhotoMetadata,
  deleteImage,
  verifyAuthToken,
};
