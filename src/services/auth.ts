import { supabase } from '../config/supabase';
import { registerPushToken } from './notifications';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { validateUsername } from '../utils/usernameValidator';

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
}

/**
 * Sign up a new user with email verification
 */
export async function signUp(email: string, password: string, username: string) {
  try {
    // Validate username
    const validation = validateUsername(username);
    if (!validation.valid) {
      return { 
        user: null, 
        session: null, 
        needsEmailVerification: false, 
        error: new Error(validation.error) 
      };
    }

    // 1. Create auth user with metadata (trigger will create profile)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          display_name: username,
        },
        emailRedirectTo: undefined, // Will be handled in-app
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup');

    // Register push token after successful signup
    await registerPushToken(authData.user.id);

    // Profile is automatically created by database trigger
    return { 
      user: authData.user, 
      session: authData.session,
      needsEmailVerification: !authData.session, // If no session, email verification is required
      error: null 
    };
  } catch (error) {
    console.error('Error signing up:', error);
    return { user: null, session: null, needsEmailVerification: false, error };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Register push token after successful login
    if (data.user) {
      await registerPushToken(data.user.id);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { profile: data, error: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null, error };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: { username?: string; display_name?: string; bio?: string }
) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { profile: data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { profile: null, error };
  }
}

/**
 * Sign in with Apple
 */
export async function signInWithApple() {
  try {
    const nonce = Math.random().toString(36).substring(2, 10);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    // Sign in with Supabase using Apple ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
      nonce: nonce,
    });

    if (error) throw error;

    // Check if user profile exists, create if not
    if (data.user) {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        // Create profile for new Apple user
        const fullName = credential.fullName;
        const displayName = fullName?.givenName || 'User';
        const username = `user_${data.user.id.substring(0, 8)}`;

        await supabase.from('users').insert({
          id: data.user.id,
          username: username,
          display_name: displayName,
        });
      }

      // Register push token
      await registerPushToken(data.user.id);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      // User canceled the sign in
      return { user: null, session: null, error: null };
    }
    console.error('Error signing in with Apple:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Check if Apple Sign-In is available
 */
export async function isAppleAuthAvailable() {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { error };
  }
}

/**
 * Verify email with token from deep link
 */
export async function verifyEmail(tokenHash: string, type: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    });

    if (error) throw error;

    // Register push token after successful verification
    if (data.user) {
      await registerPushToken(data.user.id);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Error verifying email:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Upload profile picture to Supabase Storage
 */
export async function uploadProfilePicture(userId: string, imageUri: string) {
  try {
    // Import FileSystem here to avoid circular deps
    const FileSystem = require('expo-file-system/legacy');
    
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Convert to blob-like format
    const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const fileName = `${userId}-${Date.now()}.jpg`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { avatarUrl, error: null };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return { avatarUrl: null, error };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'rewind://auth/reset-password', // Deep link back to app
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { error };
  }
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error };
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount(userId: string) {
  try {
    // 1. Delete user's sticky notes
    await supabase.from('sticky_notes').delete().eq('user_id', userId);

    // 2. Delete user's follows (follower and following)
    await supabase.from('follows').delete().eq('follower_id', userId);
    await supabase.from('follows').delete().eq('following_id', userId);

    // 3. Delete user's likes
    await supabase.from('likes').delete().eq('user_id', userId);

    // 4. Delete user's comments
    await supabase.from('comments').delete().eq('user_id', userId);

    // 5. Delete user's photos
    const { error: photosError } = await supabase
      .from('photos')
      .delete()
      .eq('user_id', userId);
    
    if (photosError) throw photosError;

    // 6. Delete user profile
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (profileError) throw profileError;

    // 7. Sign out (Supabase will handle auth user cleanup)
    await supabase.auth.signOut();

    return { error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { error };
  }
}
