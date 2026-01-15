-- Rewind App - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  -- Notification preferences (all enabled by default)
  notif_daily_rewind BOOLEAN DEFAULT TRUE,
  notif_new_message BOOLEAN DEFAULT TRUE,
  notif_message_reminder BOOLEAN DEFAULT TRUE,
  notif_photo_liked BOOLEAN DEFAULT TRUE,
  notif_photo_commented BOOLEAN DEFAULT TRUE,
  notif_new_follower BOOLEAN DEFAULT TRUE,
  -- Push notification token for Expo
  push_token TEXT,
  -- Smart timing: track user's preferred posting time (hour 0-23)
  preferred_post_hour INTEGER,
  -- Track when user last viewed their followers list (for badge count)
  last_viewed_followers_at TIMESTAMP WITH TIME ZONE,
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
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
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

-- Sticky notes table
CREATE TABLE IF NOT EXISTS public.sticky_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  color TEXT DEFAULT 'yellow',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Daily posts tracking table
CREATE TABLE IF NOT EXISTS public.daily_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_date)
);

-- Sticky Messages table (DMs with sticky note aesthetic)
CREATE TABLE IF NOT EXISTS public.sticky_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  color TEXT DEFAULT 'yellow',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (sender_id != recipient_id)
);

-- Reports table (for content moderation)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.sticky_messages(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  CHECK (
    (reported_user_id IS NOT NULL) OR 
    (photo_id IS NOT NULL) OR 
    (comment_id IS NOT NULL) OR 
    (message_id IS NOT NULL)
  )
);

-- Blocked Users table (user-to-user blocking)
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON public.comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_likes_photo_id ON public.likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_user_id ON public.sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_created_at ON public.sticky_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_daily_posts_user_date ON public.daily_posts(user_id, post_date DESC);
CREATE INDEX IF NOT EXISTS idx_sticky_messages_sender ON public.sticky_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sticky_messages_recipient ON public.sticky_messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sticky_messages_unread ON public.sticky_messages(recipient_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

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

-- Sticky notes policies
CREATE POLICY "Users can view own sticky notes"
  ON public.sticky_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sticky notes"
  ON public.sticky_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sticky notes"
  ON public.sticky_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sticky notes"
  ON public.sticky_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Daily posts policies
CREATE POLICY "Users can view own daily posts"
  ON public.daily_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily posts"
  ON public.daily_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sticky messages policies
CREATE POLICY "Users can view messages they sent or received"
  ON public.sticky_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages to mutual followers"
  ON public.sticky_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.follows f1
      WHERE f1.follower_id = auth.uid() AND f1.following_id = recipient_id
    ) AND
    EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = recipient_id AND f2.following_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages they received"
  ON public.sticky_messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Users can delete messages they sent or received"
  ON public.sticky_messages FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Reports policies
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Blocked users policies
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

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

-- Storage Buckets and Policies

-- Create profile-pictures bucket (run this in Storage dashboard or via SQL)
-- This bucket will store user profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-pictures
CREATE POLICY "Allow authenticated users to upload profile pictures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to update their own profile pictures"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own profile pictures"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public to view profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');
