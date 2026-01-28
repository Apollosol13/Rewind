-- Migration: Add Friend Posted Notifications
-- Run this in your Supabase SQL Editor

-- Add notif_friend_posted column to users table (enabled by default)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notif_friend_posted BOOLEAN DEFAULT TRUE;

-- Update existing users to have friend notifications enabled
UPDATE public.users 
SET notif_friend_posted = TRUE 
WHERE notif_friend_posted IS NULL;

-- Add comment
COMMENT ON COLUMN public.users.notif_friend_posted IS 'Receive notifications when friends (people you follow) post new Rewinds';
