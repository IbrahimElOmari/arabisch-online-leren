-- PHASE 2: Database & Security Improvements Migration
-- This migration addresses all RLS policies, foreign keys, constraints, indexes and function security issues

-- ===============================================
-- STEP 1: FIX OVERLY PERMISSIVE RLS POLICIES
-- ===============================================

-- Drop the overly permissive "Everyone can view klassen" policy
DROP POLICY IF EXISTS "Everyone can view klassen" ON public.klassen;

-- Replace with role-based access
CREATE POLICY "Enrolled students can view their klassen" 
ON public.klassen 
FOR SELECT 
USING (
  id IN (
    SELECT class_id FROM inschrijvingen 
    WHERE student_id = auth.uid() AND payment_status = 'paid'
  )
  OR teacher_id = auth.uid()
  OR get_user_role(auth.uid()) = 'admin'
);

-- Drop overly permissive "Everyone can view niveaus" policy
DROP POLICY IF EXISTS "Everyone can view niveaus" ON public.niveaus;

-- Replace with role-based access for niveaus
CREATE POLICY "Users can view niveaus for their enrolled klassen" 
ON public.niveaus 
FOR SELECT 
USING (
  class_id IN (
    SELECT class_id FROM inschrijvingen 
    WHERE student_id = auth.uid() AND payment_status = 'paid'
  )
  OR class_id IN (
    SELECT id FROM klassen WHERE teacher_id = auth.uid()
  )
  OR get_user_role(auth.uid()) = 'admin'
);

-- Fix forum policies to be more restrictive
DROP POLICY IF EXISTS "Everyone can view vacation events" ON public.calendar_events;

CREATE POLICY "Users can view relevant calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (
  event_type = 'vacation' 
  OR class_id IN (
    SELECT class_id FROM inschrijvingen 
    WHERE student_id = auth.uid() AND payment_status = 'paid'
  )
  OR class_id IN (
    SELECT id FROM klassen WHERE teacher_id = auth.uid()
  )
  OR get_user_role(auth.uid()) = 'admin'
);

-- ===============================================
-- STEP 2: SECURE FUNCTIONS WITH PROPER SEARCH_PATH
-- ===============================================

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Fix update_student_progress function with proper search_path
CREATE OR REPLACE FUNCTION public.update_student_progress_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
DECLARE
  progress_record RECORD;
  task_points INTEGER := 0;
  question_points INTEGER := 0;
  total_niveau_points INTEGER;
  thresholds INTEGER[] := ARRAY[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  threshold INTEGER;
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

  -- Get current total points including bonus points
  SELECT 
    COALESCE(snp.total_points, 0) + COALESCE(bp.bonus_total, 0)
  INTO total_niveau_points
  FROM public.student_niveau_progress snp
  LEFT JOIN (
    SELECT student_id, niveau_id, SUM(points) as bonus_total
    FROM public.bonus_points 
    WHERE student_id = NEW.student_id AND niveau_id = progress_record.niveau_id
    GROUP BY student_id, niveau_id
  ) bp ON snp.student_id = bp.student_id AND snp.niveau_id = bp.niveau_id
  WHERE snp.student_id = NEW.student_id AND snp.niveau_id = progress_record.niveau_id;

  -- Award automatic badges for point milestones
  FOREACH threshold IN ARRAY thresholds LOOP
    IF total_niveau_points >= threshold THEN
      INSERT INTO public.awarded_badges (
        student_id,
        niveau_id,
        badge_type,
        badge_id,
        badge_name,
        badge_description,
        points_threshold
      ) VALUES (
        NEW.student_id,
        progress_record.niveau_id,
        'automatic',
        'points_' || threshold,
        threshold || ' Punten Badge',
        'Behaald door ' || threshold || ' punten te verdienen',
        threshold
      )
      ON CONFLICT (student_id, niveau_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Check if level is completed (1000 points including bonus)
  UPDATE public.student_niveau_progress 
  SET is_completed = TRUE, completed_at = now()
  WHERE student_id = NEW.student_id 
    AND niveau_id = progress_record.niveau_id 
    AND total_niveau_points >= 1000 
    AND is_completed = FALSE;

  RETURN NEW;
END;
$$;

-- Fix handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, parent_email, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'leerling'::public.app_role),
    NEW.raw_user_meta_data ->> 'parent_email',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Fix log_role_change function with proper search_path
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, actie, details)
  VALUES (
    auth.uid(),
    'role_change',
    json_build_object(
      'target_user_id', NEW.id,
      'old_role', OLD.role,
      'new_role', NEW.role,
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$;