-- Fix function search path security issues

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_student_progress_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  progress_record RECORD;
  task_points INTEGER := 0;
  question_points INTEGER := 0;
  total_niveau_points INTEGER;
  new_badge_threshold INTEGER;
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
    FROM tasks t 
    WHERE t.id = NEW.task_id;
  ELSIF TG_TABLE_NAME = 'antwoorden' THEN
    SELECT v.niveau_id INTO progress_record.niveau_id
    FROM vragen v 
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
    total_points = student_niveau_progress.total_points + (task_points + question_points),
    completed_tasks = student_niveau_progress.completed_tasks + 
      CASE WHEN TG_TABLE_NAME = 'task_submissions' THEN 1 ELSE 0 END,
    completed_questions = student_niveau_progress.completed_questions + 
      CASE WHEN TG_TABLE_NAME = 'antwoorden' THEN 1 ELSE 0 END,
    updated_at = now();

  -- Get current total points including bonus points
  SELECT 
    COALESCE(snp.total_points, 0) + COALESCE(bp.bonus_total, 0)
  INTO total_niveau_points
  FROM student_niveau_progress snp
  LEFT JOIN (
    SELECT student_id, niveau_id, SUM(points) as bonus_total
    FROM bonus_points 
    WHERE student_id = NEW.student_id AND niveau_id = progress_record.niveau_id
    GROUP BY student_id, niveau_id
  ) bp ON snp.student_id = bp.student_id AND snp.niveau_id = bp.niveau_id
  WHERE snp.student_id = NEW.student_id AND snp.niveau_id = progress_record.niveau_id;

  -- Award automatic badges for point milestones using array iteration
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
$function$;

-- Update get_total_niveau_points function
CREATE OR REPLACE FUNCTION public.get_total_niveau_points(p_student_id UUID, p_niveau_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    COALESCE(snp.total_points, 0) + COALESCE(bp.bonus_total, 0)
  FROM student_niveau_progress snp
  LEFT JOIN (
    SELECT student_id, niveau_id, SUM(points) as bonus_total
    FROM bonus_points 
    WHERE student_id = p_student_id AND niveau_id = p_niveau_id
    GROUP BY student_id, niveau_id
  ) bp ON snp.student_id = bp.student_id AND snp.niveau_id = bp.niveau_id
  WHERE snp.student_id = p_student_id AND snp.niveau_id = p_niveau_id;
$function$;