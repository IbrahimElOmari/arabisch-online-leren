-- Add age and theme preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN age INTEGER,
ADD COLUMN theme_preference TEXT DEFAULT 'auto' CHECK (theme_preference IN ('auto', 'playful', 'clean', 'professional'));

-- Update existing profiles to have theme auto-detect based on age
UPDATE public.profiles 
SET theme_preference = 'auto' 
WHERE theme_preference IS NULL;