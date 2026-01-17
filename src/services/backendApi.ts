import { supabase } from '../config/supabase';

/**
 * Backend API Client
 * Communicates with Railway backend for image processing
 */

const BACKEND_URL = 'https://rewind-production-3dc8.up.railway.app';

/**
 * Get current user's auth token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Upload photo to backend for processing and storage
 * @param imageUri - Local image URI
 * @param caption - Optional caption
 * @param photoStyle - Filter style (polaroid, camcorder, etc.)
 * @param latitude - Optional latitude
 * @param longitude - Optional longitude
 * @returns Photo data with URLs
 */
export async function uploadPhotoToBackend(
  imageUri: string,
  caption?: string,
  photoStyle?: string,
  latitude?: number,
  longitude?: number
) {
  try {
    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Create form data
    const formData = new FormData();
    
    // Add photo file
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    // Add metadata
    if (caption) formData.append('caption', caption);
    if (photoStyle) formData.append('photoStyle', photoStyle);
    if (latitude) formData.append('latitude', latitude.toString());
    if (longitude) formData.append('longitude', longitude.toString());
    formData.append('promptTime', new Date().toISOString());

    console.log('📤 Uploading photo to backend...');

    // Upload to backend
    const response = await fetch(`${BACKEND_URL}/api/photos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Photo uploaded successfully!');
    console.log(`   Compression: ${data.processing?.savings || 'N/A'}`);
    console.log(`   Image URL: ${data.photo.imageUrl}`);

    return {
      id: data.photo.id,
      imageUrl: data.photo.imageUrl,
      thumbnailUrl: data.photo.thumbnailUrl,
      caption: data.photo.caption,
      photoStyle: data.photo.photoStyle,
      createdAt: data.photo.createdAt,
      processing: data.processing,
    };
  } catch (error) {
    console.error('❌ Backend upload failed:', error);
    throw error;
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    return {
      healthy: data.status === 'healthy',
      uptime: data.uptime,
      memory: data.memory,
    };
  } catch (error) {
    console.error('Backend health check failed:', error);
    return { healthy: false };
  }
}

/**
 * Get backend configuration info
 */
export async function getBackendInfo() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/photos/test`);
    const data = await response.json();
    return {
      configured: data.supabase_configured,
      config: data.config,
    };
  } catch (error) {
    console.error('Failed to get backend info:', error);
    return null;
  }
}

export default {
  uploadPhotoToBackend,
  checkBackendHealth,
  getBackendInfo,
};
