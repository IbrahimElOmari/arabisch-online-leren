-- PHASE 2: Part 2 - Foreign Keys, Constraints, Indexes and Additional Function Fixes
-- Continuing security improvements

-- ===============================================
-- STEP 2B: FIX REMAINING FUNCTIONS WITH SEARCH_PATH
-- ===============================================

-- Fix cleanup_expired_sessions function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
  UPDATE public.user_security_sessions 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  -- Log cleanup activity
  INSERT INTO public.audit_log (user_id, actie, details, severity)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'session_cleanup',
    json_build_object('cleaned_sessions', ROW_COUNT),
    'info'
  );
END;
$$;

-- Fix check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action_type text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
DECLARE
  current_attempts INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  -- Get current attempts in the window
  SELECT COALESCE(SUM(attempt_count), 0) INTO current_attempts
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND first_attempt >= window_start
    AND (blocked_until IS NULL OR blocked_until <= NOW());
  
  -- If within limits, allow
  IF current_attempts < p_max_attempts THEN
    -- Insert or update rate limit record
    INSERT INTO public.auth_rate_limits (identifier, action_type, attempt_count, first_attempt, last_attempt)
    VALUES (p_identifier, p_action_type, 1, NOW(), NOW())
    ON CONFLICT (identifier, action_type) 
    DO UPDATE SET 
      attempt_count = public.auth_rate_limits.attempt_count + 1,
      last_attempt = NOW();
    
    RETURN TRUE;
  ELSE
    -- Block for additional time
    UPDATE public.auth_rate_limits 
    SET blocked_until = NOW() + INTERVAL '1 hour'
    WHERE identifier = p_identifier AND action_type = p_action_type;
    
    RETURN FALSE;
  END IF;
END;
$$;

-- Fix export_user_data function
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
DECLARE
  user_data JSONB;
BEGIN
  -- Only allow users to export their own data or admins
  IF auth.uid() != p_user_id AND public.get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized data export attempt';
  END IF;
  
  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = p_user_id),
    'forum_posts', (SELECT json_agg(fp) FROM public.forum_posts fp WHERE fp.author_id = p_user_id),
    'forum_threads', (SELECT json_agg(ft) FROM public.forum_threads ft WHERE ft.author_id = p_user_id),
    'task_submissions', (SELECT json_agg(ts) FROM public.task_submissions ts WHERE ts.student_id = p_user_id),
    'enrollments', (SELECT json_agg(i) FROM public.inschrijvingen i WHERE i.student_id = p_user_id),
    'consents', (SELECT json_agg(uc) FROM public.user_consents uc WHERE uc.user_id = p_user_id)
  ) INTO user_data;
  
  -- Log the export
  INSERT INTO public.audit_log (user_id, actie, details, severity)
  VALUES (
    auth.uid(),
    'data_export',
    json_build_object('exported_user', p_user_id, 'timestamp', NOW()),
    'info'
  );
  
  RETURN user_data;
END;
$$;

-- Fix get_total_niveau_points function
CREATE OR REPLACE FUNCTION public.get_total_niveau_points(p_student_id uuid, p_niveau_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
  SELECT 
    COALESCE(snp.total_points, 0) + COALESCE(bp.bonus_total, 0)
  FROM public.student_niveau_progress snp
  LEFT JOIN (
    SELECT student_id, niveau_id, SUM(points) as bonus_total
    FROM public.bonus_points 
    WHERE student_id = p_student_id AND niveau_id = p_niveau_id
    GROUP BY student_id, niveau_id
  ) bp ON snp.student_id = bp.student_id AND snp.niveau_id = bp.niveau_id
  WHERE snp.student_id = p_student_id AND snp.niveau_id = p_niveau_id;
$$;

-- ===============================================
-- STEP 3: ADD FOREIGN KEY CONSTRAINTS
-- ===============================================

-- Add foreign key constraints where missing
-- Note: Some may already exist, using IF NOT EXISTS pattern

-- Profiles table foreign keys
DO $$ 
BEGIN
    -- Add foreign key for profiles.id -> auth.users.id (if not exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Klassen table foreign keys
DO $$ 
BEGIN
    -- Add foreign key for klassen.teacher_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'klassen_teacher_id_fkey' 
        AND table_name = 'klassen'
    ) THEN
        ALTER TABLE public.klassen 
        ADD CONSTRAINT klassen_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Niveaus table foreign keys
DO $$ 
BEGIN
    -- Add foreign key for niveaus.class_id -> klassen.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'niveaus_class_id_fkey' 
        AND table_name = 'niveaus'
    ) THEN
        ALTER TABLE public.niveaus 
        ADD CONSTRAINT niveaus_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.klassen(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Inschrijvingen table foreign keys
DO $$ 
BEGIN
    -- Add foreign key for inschrijvingen.student_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inschrijvingen_student_id_fkey' 
        AND table_name = 'inschrijvingen'
    ) THEN
        ALTER TABLE public.inschrijvingen 
        ADD CONSTRAINT inschrijvingen_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for inschrijvingen.class_id -> klassen.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inschrijvingen_class_id_fkey' 
        AND table_name = 'inschrijvingen'
    ) THEN
        ALTER TABLE public.inschrijvingen 
        ADD CONSTRAINT inschrijvingen_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.klassen(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tasks table foreign keys
DO $$ 
BEGIN
    -- Add foreign key for tasks.level_id -> niveaus.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_level_id_fkey' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_level_id_fkey 
        FOREIGN KEY (level_id) REFERENCES public.niveaus(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for tasks.author_id -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_author_id_fkey' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;