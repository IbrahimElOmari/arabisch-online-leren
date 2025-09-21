-- PHASE 2: Part 3 - Final Constraints, Indexes and Remaining Function Fix

-- ===============================================
-- CONTINUE ADDING FOREIGN KEY CONSTRAINTS
-- ===============================================

-- Vragen table foreign keys
DO $$ 
BEGIN
    -- Add foreign key for vragen.niveau_id -> niveaus.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vragen_niveau_id_fkey' 
        AND table_name = 'vragen'
    ) THEN
        ALTER TABLE public.vragen 
        ADD CONSTRAINT vragen_niveau_id_fkey 
        FOREIGN KEY (niveau_id) REFERENCES public.niveaus(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Antwoorden table foreign keys
DO $$ 
BEGIN
    -- Add foreign key for antwoorden.student_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'antwoorden_student_id_fkey' 
        AND table_name = 'antwoorden'
    ) THEN
        ALTER TABLE public.antwoorden 
        ADD CONSTRAINT antwoorden_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for antwoorden.vraag_id -> vragen.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'antwoorden_vraag_id_fkey' 
        AND table_name = 'antwoorden'
    ) THEN
        ALTER TABLE public.antwoorden 
        ADD CONSTRAINT antwoorden_vraag_id_fkey 
        FOREIGN KEY (vraag_id) REFERENCES public.vragen(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for antwoorden.beoordeeld_door -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'antwoorden_beoordeeld_door_fkey' 
        AND table_name = 'antwoorden'
    ) THEN
        ALTER TABLE public.antwoorden 
        ADD CONSTRAINT antwoorden_beoordeeld_door_fkey 
        FOREIGN KEY (beoordeeld_door) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Task submissions foreign keys
DO $$ 
BEGIN
    -- Add foreign key for task_submissions.task_id -> tasks.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_submissions_task_id_fkey' 
        AND table_name = 'task_submissions'
    ) THEN
        ALTER TABLE public.task_submissions 
        ADD CONSTRAINT task_submissions_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for task_submissions.student_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_submissions_student_id_fkey' 
        AND table_name = 'task_submissions'
    ) THEN
        ALTER TABLE public.task_submissions 
        ADD CONSTRAINT task_submissions_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ===============================================
-- STEP 4: ADD NOT NULL CONSTRAINTS
-- ===============================================

-- Update profiles table NOT NULL constraints where appropriate
ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;

-- Update klassen table NOT NULL constraints
ALTER TABLE public.klassen ALTER COLUMN name SET NOT NULL;

-- Update niveaus table NOT NULL constraints
ALTER TABLE public.niveaus ALTER COLUMN naam SET NOT NULL;
ALTER TABLE public.niveaus ALTER COLUMN niveau_nummer SET NOT NULL;

-- Update lessen table NOT NULL constraints
ALTER TABLE public.lessen ALTER COLUMN title SET NOT NULL;

-- Update aanwezigheid table NOT NULL constraints  
ALTER TABLE public.aanwezigheid ALTER COLUMN status SET NOT NULL;

-- Update tasks table NOT NULL constraints
ALTER TABLE public.tasks ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN required_submission_type SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN grading_scale SET NOT NULL;

-- Update vragen table NOT NULL constraints
ALTER TABLE public.vragen ALTER COLUMN vraag_tekst SET NOT NULL;
ALTER TABLE public.vragen ALTER COLUMN vraag_type SET NOT NULL;

-- ===============================================
-- STEP 5: ADD PERFORMANCE INDEXES
-- ===============================================

-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inschrijvingen_student_id ON public.inschrijvingen(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inschrijvingen_class_id ON public.inschrijvingen(class_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inschrijvingen_payment_status ON public.inschrijvingen(payment_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_klassen_teacher_id ON public.klassen(teacher_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_niveaus_class_id ON public.niveaus(class_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_level_id ON public.tasks(level_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_author_id ON public.tasks(author_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vragen_niveau_id ON public.vragen(niveau_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_antwoorden_student_id ON public.antwoorden(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_antwoorden_vraag_id ON public.antwoorden(vraag_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_submissions_task_id ON public.task_submissions(task_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_submissions_student_id ON public.task_submissions(student_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_posts_class_id ON public.forum_posts(class_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_posts_author_id ON public.forum_posts(author_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_threads_class_id ON public.forum_threads(class_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_threads_author_id ON public.forum_threads(author_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_niveau_progress_student_id ON public.student_niveau_progress(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_niveau_progress_niveau_id ON public.student_niveau_progress(niveau_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bonus_points_student_id ON public.bonus_points(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bonus_points_niveau_id ON public.bonus_points(niveau_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_awarded_badges_student_id ON public.awarded_badges(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_awarded_badges_niveau_id ON public.awarded_badges(niveau_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_rate_limits_identifier ON public.auth_rate_limits(identifier);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_rate_limits_action_type ON public.auth_rate_limits(action_type);

-- ===============================================
-- STEP 6: FIX REMAINING FUNCTION SEARCH PATH
-- ===============================================

-- Fix update_updated_at_column function (the remaining one showing in warnings)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;