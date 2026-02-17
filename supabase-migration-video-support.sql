-- Add video support to photos table
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'photo';

-- Create index for media type filtering
CREATE INDEX IF NOT EXISTS idx_photos_media_type ON public.photos(media_type);
