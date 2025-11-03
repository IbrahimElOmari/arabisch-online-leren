-- PR6: Rich Content Editor & Media Library

-- media_library: store uploaded media files
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_library') THEN
    CREATE TABLE public.media_library (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      uploaded_by UUID,
      tags TEXT[] DEFAULT '{}',
      alt_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Teachers manage media"
      ON public.media_library FOR ALL
      USING (
        has_role(auth.uid(), 'leerkracht'::app_role) OR
        has_role(auth.uid(), 'admin'::app_role)
      );
  END IF;
END $$;