-- Add polaroid_video_url column for pre-rendered polaroid-framed video sharing
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS polaroid_video_url TEXT;
