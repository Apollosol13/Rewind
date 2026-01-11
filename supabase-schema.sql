-- Rewind App - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  prompt_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, photo_id)
);

-- Daily prompts table (for tracking when notifications are sent)
CREATE TABLE IF NOT EXISTS public.daily_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON public.comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_likes_photo_id ON public.likes(photo_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prompts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Photos policies
CREATE POLICY "Anyone can view photos"
  ON public.photos FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own photos"
  ON public.photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
  ON public.photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
  ON public.photos FOR DELETE
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- Daily prompts policies (admin only)
CREATE POLICY "Anyone can view prompts"
  ON public.daily_prompts FOR SELECT
  USING (true);

-- Functions

-- Function to handle user creation (trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
