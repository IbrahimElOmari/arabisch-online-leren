-- Create media storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Create storage policies for media uploads
CREATE POLICY "Media files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add audio_url and video_url columns to vragen table if not exist
ALTER TABLE vragen ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE vragen ADD COLUMN IF NOT EXISTS video_url TEXT;