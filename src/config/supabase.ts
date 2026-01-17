import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Access extra config correctly for production builds
const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

const supabaseUrl = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL or Anon Key is missing! Check app.json configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
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
  photo_style?: string;
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
