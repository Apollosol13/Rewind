import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Please add them to your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: undefined, // Will be set up later with async storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types
export interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  prompt_time: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  users?: User;
  likes_count?: number;
  comments_count?: number;
}

export interface Comment {
  id: string;
  photo_id: string;
  user_id: string;
  text: string;
  created_at: string;
  users?: User;
}

export interface Like {
  user_id: string;
  photo_id: string;
  created_at: string;
}
