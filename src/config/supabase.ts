import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Initialize Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Export types
export type { User, Session } from '@supabase/supabase-js';

// Photo interface
export interface Photo {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  prompt_time: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  likes_count?: number;
  comments_count?: number;
  photo_style?: string;
  posted_on_time?: boolean; // Whether photo was posted within 3:30 timer
  minutes_late?: number; // How many minutes late (0 if on time)
  users?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// Comment interface
export interface Comment {
  id: string;
  photo_id: string;
  user_id: string;
  text: string;
  parent_comment_id?: string;
  created_at: string;
  users?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// User interface
export interface User {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  notif_daily_rewind?: boolean;
  notif_new_message?: boolean;
  notif_message_reminder?: boolean;
  notif_photo_liked?: boolean;
  notif_photo_commented?: boolean;
  notif_new_follower?: boolean;
  push_token?: string;
}
