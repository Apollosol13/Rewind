-- Add photo_style column to photos table
-- This stores which filter was used for each photo (polaroid, vintage, sepia, legacy, film, camcorder)

-- Add the column (defaults to 'polaroid' for existing photos)
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS photo_style TEXT DEFAULT 'polaroid';

-- Create an index for faster filtering by photo_style
CREATE INDEX IF NOT EXISTS idx_photos_photo_style ON photos(photo_style);

-- Optional: Add a check constraint to ensure only valid filter types
ALTER TABLE photos
ADD CONSTRAINT check_photo_style 
CHECK (photo_style IN ('polaroid', 'vintage', 'sepia', 'legacy', 'film', 'camcorder'));
