import { supabase } from '../config/supabase';

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, username: string) {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup');

    // 2. Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          username: username,
          display_name: username,
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) throw profileError;

    return { user: authData.user, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { user: null, error };
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
