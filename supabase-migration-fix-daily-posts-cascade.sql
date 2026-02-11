-- ========================================
-- Fix Daily Posts CASCADE Delete Issue
-- ========================================
-- Problem: When a photo is deleted, the daily_posts entry is also deleted (ON DELETE CASCADE),
-- allowing users to post again on the same day after deletion.
-- Solution: Change the foreign key constraint to SET NULL instead of CASCADE,
-- so the daily_posts entry remains but just removes the photo reference.

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.daily_posts
DROP CONSTRAINT IF EXISTS daily_posts_photo_id_fkey;

-- Step 2: Re-add the constraint with SET NULL instead of CASCADE
-- This ensures when a photo is deleted, the daily_posts entry remains with photo_id = NULL
ALTER TABLE public.daily_posts
ADD CONSTRAINT daily_posts_photo_id_fkey 
FOREIGN KEY (photo_id) 
REFERENCES public.photos(id) 
ON DELETE SET NULL;

-- Step 3: Add a comment explaining the behavior
COMMENT ON CONSTRAINT daily_posts_photo_id_fkey ON public.daily_posts IS 
'SET NULL on delete to preserve daily post limit even if photo is deleted';

-- Verify the change
SELECT 
  constraint_name,
  table_name,
  column_name,
  constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'daily_posts' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- ========================================
-- Expected Result:
-- ========================================
-- Now when a user deletes their photo:
-- 1. The photo is removed from the photos table
-- 2. The daily_posts entry remains with photo_id = NULL
-- 3. The user cannot post again until the next day
-- 4. The one-post-per-day limit is preserved across all platforms
