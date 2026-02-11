-- Rewind Timer System Migration
-- Adds fields for 3:30 timer and 24-hour notification cycle
-- Run this in Supabase SQL Editor

-- Add notification timing fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notification_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_post_time TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.users.notification_time IS 'Daily notification time (e.g. 14:47:00 for 2:47 PM)';
COMMENT ON COLUMN public.users.last_post_time IS 'When user last posted - used for 24-hour cycle';

-- Add timer tracking fields to photos table
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS posted_on_time BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS minutes_late INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.photos.posted_on_time IS 'Whether photo was posted within 3:30 timer';
COMMENT ON COLUMN public.photos.minutes_late IS 'How many minutes late the post was (0 if on time)';

-- Add index for querying on-time vs late posts
CREATE INDEX IF NOT EXISTS idx_photos_posted_on_time ON public.photos(posted_on_time);

-- Note: NULL notification_time means user hasn't set their schedule yet
-- They'll be migrated when they post their next photo
