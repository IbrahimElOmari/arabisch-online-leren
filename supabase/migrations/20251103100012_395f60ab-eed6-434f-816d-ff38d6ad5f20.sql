-- PR5: Lessons Tables (minimal, no indexes yet)

-- prep_lessons: self-study preparatory lessons
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prep_lessons') THEN
    CREATE TABLE public.prep_lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
      level_id UUID REFERENCES public.module_levels(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      content_id UUID,
      content_type TEXT DEFAULT 'html',
      duration_minutes INTEGER,
      sequence_order INTEGER DEFAULT 0,
      is_published BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by UUID
    );
    
    ALTER TABLE public.prep_lessons ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- live_lessons: scheduled live sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'live_lessons') THEN
    CREATE TABLE public.live_lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
      class_id UUID REFERENCES public.module_classes(id) ON DELETE SET NULL,
      level_id UUID REFERENCES public.module_levels(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      starts_at TIMESTAMPTZ NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      join_link TEXT,
      recording_link TEXT,
      notes TEXT,
      teacher_id UUID,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.live_lessons ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;