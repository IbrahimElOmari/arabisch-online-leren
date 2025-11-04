-- PR6 Extended: Content versioning and lesson content (fixed)

-- content_library: stores rich content for lessons
CREATE TABLE IF NOT EXISTS public.content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  module_id UUID,
  level_id UUID,
  created_by UUID,
  updated_by UUID,
  published_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  parent_version_id UUID REFERENCES public.content_library(id),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers manage content' AND tablename = 'content_library') THEN
    CREATE POLICY "Teachers manage content"
      ON public.content_library FOR ALL
      USING (
        has_role(auth.uid(), 'leerkracht'::app_role) OR
        has_role(auth.uid(), 'admin'::app_role)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students view published content' AND tablename = 'content_library') THEN
    CREATE POLICY "Students view published content"
      ON public.content_library FOR SELECT
      USING (
        status = 'published' AND (
          EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.student_id = auth.uid()
            AND e.module_id = content_library.module_id
            AND (e.level_id = content_library.level_id OR content_library.level_id IS NULL)
            AND e.status = 'active'
          )
        )
      );
  END IF;
END $$;

-- Update prep_lessons and live_lessons to reference content_library
ALTER TABLE public.prep_lessons 
  ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.content_library(id);

ALTER TABLE public.live_lessons 
  ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.content_library(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_library_module ON public.content_library(module_id);
CREATE INDEX IF NOT EXISTS idx_content_library_level ON public.content_library(level_id);
CREATE INDEX IF NOT EXISTS idx_content_library_status ON public.content_library(status);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON public.media_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_content_templates_type ON public.content_templates(template_type);

-- Trigger for updated_at on content_library
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_content_updated_at') THEN
    CREATE FUNCTION update_content_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS content_library_updated_at ON public.content_library;
CREATE TRIGGER content_library_updated_at
  BEFORE UPDATE ON public.content_library
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();

DROP TRIGGER IF EXISTS content_templates_updated_at ON public.content_templates;
CREATE TRIGGER content_templates_updated_at
  BEFORE UPDATE ON public.content_templates
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();

DROP TRIGGER IF EXISTS media_library_updated_at ON public.media_library;
CREATE TRIGGER media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();