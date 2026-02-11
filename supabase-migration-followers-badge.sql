-- Migration: Add last_viewed_followers_at to users table for follower badge feature
-- Run this in your Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_viewed_followers_at TIMESTAMP WITH TIME ZONE;

-- Set existing users' last_viewed_followers_at to NOW() so they start with no badge
UPDATE public.users 
SET last_viewed_followers_at = NOW() 
WHERE last_viewed_followers_at IS NULL;
