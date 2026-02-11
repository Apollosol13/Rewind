import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system/legacy';

// Railway backend URL
const BACKEND_URL = 'https://rewind-production-3dc8.up.railway.app';

/**
 * Upload photo to backend for processing
 * The backend will compress, resize, and apply filters
 */
export async function uploadPhotoToBackend(
  imageUri: string,
  caption: string,
  photoStyle: string = 'polaroid'
) {
  try {
    // Get current user session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    console.log('📤 Uploading photo to backend...');
    console.log(`   Style: ${photoStyle}`);
    console.log(`   Caption: ${caption || 'None'}`);

    // Create form data
    const formData = new FormData();
    
    // Add photo file - React Native format
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Photo file not found');
    }

    // React Native requires this specific format for file uploads
    formData.append('photo', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    
    formData.append('caption', caption || '');
    formData.append('photoStyle', photoStyle);
    formData.append('promptTime', new Date().toISOString());

    // Upload to backend
    const uploadResponse = await fetch(`${BACKEND_URL}/api/photos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        // Don't set Content-Type - let browser set it with boundary for multipart
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Backend upload failed:', uploadResponse.status, errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();
    console.log('✅ Backend upload successful:', result);

    return result.photo;
  } catch (error) {
    console.error('❌ Error uploading to backend:', error);
    throw error;
  }
}

/**
 * Test backend connection
 */
export async function testBackendConnection() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    return { healthy: data.status === 'healthy', data, error: null };
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return { healthy: false, data: null, error };
  }
}

export default {
  uploadPhotoToBackend,
  testBackendConnection,
};
