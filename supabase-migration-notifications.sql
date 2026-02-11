-- Notification Preferences Migration
-- Run this in your Supabase SQL Editor to add notification preferences to existing users table

-- Add notification preference columns (all enabled by default)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notif_daily_rewind BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_new_message BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_message_reminder BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_photo_liked BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_photo_commented BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_new_follower BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS preferred_post_hour INTEGER;

-- Update existing users to have all notifications enabled by default
UPDATE public.users
SET 
  notif_daily_rewind = TRUE,
  notif_new_message = TRUE,
  notif_message_reminder = TRUE,
  notif_photo_liked = TRUE,
  notif_photo_commented = TRUE,
  notif_new_follower = TRUE
WHERE 
  notif_daily_rewind IS NULL;

-- Success message
SELECT 'Notification preferences added successfully!' as message;
