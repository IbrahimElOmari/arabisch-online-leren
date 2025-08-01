-- Add phone_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT;

-- Add media columns to forum_posts for file uploads
ALTER TABLE public.forum_posts 
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT; -- 'image', 'video', 'audio', 'file'

-- Add media columns to tasks for rich content
ALTER TABLE public.tasks 
ADD COLUMN external_link TEXT,
ADD COLUMN youtube_url TEXT,
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT;