-- PHASE 2: Complete Database Security Hardening
-- =============================================

-- STEP 1: Fix Function Security (search_path issues)
-- ==================================================

-- Fix update_student_progress function (missing search_path)
CREATE OR REPLACE FUNCTION public.update_student_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $function$
DECLARE
  progress_record RECORD;
  task_points INTEGER := 0;
  question_points INTEGER := 0;
BEGIN
  -- Calculate points based on trigger source
  IF TG_TABLE_NAME = 'task_submissions' THEN
    task_points := COALESCE(NEW.grade, 0);
  ELSIF TG_TABLE_NAME = 'antwoorden' THEN
    question_points := COALESCE(NEW.punten, 0);
  END IF;

  -- Get niveau_id based on source
  IF TG_TABLE_NAME = 'task_submissions' THEN
    SELECT t.level_id INTO progress_record.niveau_id
    FROM public.tasks t 
    WHERE t.id = NEW.task_id;
  ELSIF TG_TABLE_NAME = 'antwoorden' THEN
    SELECT v.niveau_id INTO progress_record.niveau_id
    FROM public.vragen v 
    WHERE v.id = NEW.vraag_id;
  END IF;

  -- Update or insert progress record
  INSERT INTO public.student_niveau_progress (
    student_id, 
    niveau_id, 
    total_points,
    completed_tasks,
    completed_questions
  ) VALUES (
    NEW.student_id,
    progress_record.niveau_id,
    task_points + question_points,
    CASE WHEN TG_TABLE_NAME = 'task_submissions' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'antwoorden' THEN 1 ELSE 0 END
  )
  ON CONFLICT (student_id, niveau_id) 
  DO UPDATE SET
    total_points = public.student_niveau_progress.total_points + (task_points + question_points),
    completed_tasks = public.student_niveau_progress.completed_tasks + 
      CASE WHEN TG_TABLE_NAME = 'task_submissions' THEN 1 ELSE 0 END,
    completed_questions = public.student_niveau_progress.completed_questions + 
      CASE WHEN TG_TABLE_NAME = 'antwoorden' THEN 1 ELSE 0 END,
    updated_at = now();

  -- Check if level is completed (1000 points)
  UPDATE public.student_niveau_progress 
  SET is_completed = TRUE, completed_at = now()
  WHERE student_id = NEW.student_id 
    AND niveau_id = progress_record.niveau_id 
    AND total_points >= 1000 
    AND is_completed = FALSE;

  RETURN NEW;
END;
$function$;

-- Fix messaging functions to use proper search_path
CREATE OR REPLACE FUNCTION public.get_direct_messages(user_id uuid)
RETURNS TABLE(id uuid, sender_id uuid, receiver_id uuid, content text, read boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $function$
  SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.read, dm.created_at, dm.updated_at
  FROM public.direct_messages dm
  WHERE dm.sender_id = user_id OR dm.receiver_id = user_id
  ORDER BY dm.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_conversation_messages(user1_id uuid, user2_id uuid)
RETURNS TABLE(id uuid, sender_id uuid, receiver_id uuid, content text, read boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $function$
  SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.read, dm.created_at, dm.updated_at
  FROM public.direct_messages dm
  WHERE (dm.sender_id = user1_id AND dm.receiver_id = user2_id) 
     OR (dm.sender_id = user2_id AND dm.receiver_id = user1_id)
  ORDER BY dm.created_at ASC;
$function$;

CREATE OR REPLACE FUNCTION public.send_direct_message(sender_id uuid, receiver_id uuid, message_content text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $function$
  INSERT INTO public.direct_messages (sender_id, receiver_id, content, read)
  VALUES (sender_id, receiver_id, message_content, false)
  RETURNING id;
$function$;

CREATE OR REPLACE FUNCTION public.mark_messages_read(sender_id uuid, receiver_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $function$
  UPDATE public.direct_messages 
  SET read = true 
  WHERE direct_messages.sender_id = mark_messages_read.sender_id 
    AND direct_messages.receiver_id = mark_messages_read.receiver_id 
    AND read = false;
$function$;

-- STEP 2: Add Critical Foreign Key Constraints
-- ===========================================

-- Add foreign key constraints for proper referential integrity
DO $$ 
BEGIN
    -- Klassen -> Profiles (teacher_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'klassen_teacher_id_fkey' 
        AND table_name = 'klassen'
    ) THEN
        ALTER TABLE public.klassen 
        ADD CONSTRAINT klassen_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- Niveaus -> Klassen (class_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'niveaus_class_id_fkey' 
        AND table_name = 'niveaus'
    ) THEN
        ALTER TABLE public.niveaus 
        ADD CONSTRAINT niveaus_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.klassen(id) ON DELETE CASCADE;
    END IF;
    
    -- Lessen -> Klassen (class_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lessen_class_id_fkey' 
        AND table_name = 'lessen'
    ) THEN
        ALTER TABLE public.lessen 
        ADD CONSTRAINT lessen_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.klassen(id) ON DELETE CASCADE;
    END IF;
    
    -- Inschrijvingen -> Profiles (student_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inschrijvingen_student_id_fkey' 
        AND table_name = 'inschrijvingen'
    ) THEN
        ALTER TABLE public.inschrijvingen 
        ADD CONSTRAINT inschrijvingen_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Inschrijvingen -> Klassen (class_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inschrijvingen_class_id_fkey' 
        AND table_name = 'inschrijvingen'
    ) THEN
        ALTER TABLE public.inschrijvingen 
        ADD CONSTRAINT inschrijvingen_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.klassen(id) ON DELETE CASCADE;
    END IF;
    
    -- Tasks -> Niveaus (level_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_level_id_fkey' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_level_id_fkey 
        FOREIGN KEY (level_id) REFERENCES public.niveaus(id) ON DELETE CASCADE;
    END IF;
    
    -- Tasks -> Profiles (author_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_author_id_fkey' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Vragen -> Niveaus (niveau_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vragen_niveau_id_fkey' 
        AND table_name = 'vragen'
    ) THEN
        ALTER TABLE public.vragen 
        ADD CONSTRAINT vragen_niveau_id_fkey 
        FOREIGN KEY (niveau_id) REFERENCES public.niveaus(id) ON DELETE CASCADE;
    END IF;
    
    -- Antwoorden -> Profiles (student_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'antwoorden_student_id_fkey' 
        AND table_name = 'antwoorden'
    ) THEN
        ALTER TABLE public.antwoorden 
        ADD CONSTRAINT antwoorden_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Antwoorden -> Vragen (vraag_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'antwoorden_vraag_id_fkey' 
        AND table_name = 'antwoorden'
    ) THEN
        ALTER TABLE public.antwoorden 
        ADD CONSTRAINT antwoorden_vraag_id_fkey 
        FOREIGN KEY (vraag_id) REFERENCES public.vragen(id) ON DELETE CASCADE;
    END IF;
    
    -- Task_submissions -> Tasks (task_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_submissions_task_id_fkey' 
        AND table_name = 'task_submissions'
    ) THEN
        ALTER TABLE public.task_submissions 
        ADD CONSTRAINT task_submissions_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;
    
    -- Task_submissions -> Profiles (student_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_submissions_student_id_fkey' 
        AND table_name = 'task_submissions'
    ) THEN
        ALTER TABLE public.task_submissions 
        ADD CONSTRAINT task_submissions_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Forum tables
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'forum_threads_class_id_fkey' 
        AND table_name = 'forum_threads'
    ) THEN
        ALTER TABLE public.forum_threads 
        ADD CONSTRAINT forum_threads_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.klassen(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'forum_posts_class_id_fkey' 
        AND table_name = 'forum_posts'
    ) THEN
        ALTER TABLE public.forum_posts 
        ADD CONSTRAINT forum_posts_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.klassen(id) ON DELETE CASCADE;
    END IF;
END $$;

-- STEP 3: Add Critical Performance Indexes
-- =======================================

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_inschrijvingen_student_id ON public.inschrijvingen(student_id);
CREATE INDEX IF NOT EXISTS idx_inschrijvingen_class_id ON public.inschrijvingen(class_id);
CREATE INDEX IF NOT EXISTS idx_inschrijvingen_payment_status ON public.inschrijvingen(payment_status);

CREATE INDEX IF NOT EXISTS idx_klassen_teacher_id ON public.klassen(teacher_id);
CREATE INDEX IF NOT EXISTS idx_niveaus_class_id ON public.niveaus(class_id);
CREATE INDEX IF NOT EXISTS idx_tasks_level_id ON public.tasks(level_id);
CREATE INDEX IF NOT EXISTS idx_tasks_author_id ON public.tasks(author_id);
CREATE INDEX IF NOT EXISTS idx_vragen_niveau_id ON public.vragen(niveau_id);

CREATE INDEX IF NOT EXISTS idx_antwoorden_student_id ON public.antwoorden(student_id);
CREATE INDEX IF NOT EXISTS idx_antwoorden_vraag_id ON public.antwoorden(vraag_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON public.task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_student_id ON public.task_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_forum_posts_class_id ON public.forum_posts(class_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_class_id ON public.forum_threads(class_id);
CREATE INDEX IF NOT EXISTS idx_student_niveau_progress_student_id ON public.student_niveau_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_niveau_progress_niveau_id ON public.student_niveau_progress(niveau_id);

-- STEP 4: Add NOT NULL Constraints for Data Integrity
-- ==================================================

-- Add NOT NULL constraints where appropriate
DO $$
BEGIN
    -- Profiles table
    BEGIN
        ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;
    EXCEPTION WHEN others THEN 
        NULL; -- Column may already be NOT NULL
    END;
    
    -- Klassen table
    BEGIN
        ALTER TABLE public.klassen ALTER COLUMN name SET NOT NULL;
    EXCEPTION WHEN others THEN 
        NULL;
    END;
    
    -- Niveaus table
    BEGIN
        ALTER TABLE public.niveaus ALTER COLUMN naam SET NOT NULL;
        ALTER TABLE public.niveaus ALTER COLUMN niveau_nummer SET NOT NULL;
    EXCEPTION WHEN others THEN 
        NULL;
    END;
    
    -- Tasks table
    BEGIN
        ALTER TABLE public.tasks ALTER COLUMN title SET NOT NULL;
    EXCEPTION WHEN others THEN 
        NULL;
    END;
    
    -- Vragen table
    BEGIN
        ALTER TABLE public.vragen ALTER COLUMN vraag_tekst SET NOT NULL;
        ALTER TABLE public.vragen ALTER COLUMN vraag_type SET NOT NULL;
    EXCEPTION WHEN others THEN 
        NULL;
    END;
END $$;