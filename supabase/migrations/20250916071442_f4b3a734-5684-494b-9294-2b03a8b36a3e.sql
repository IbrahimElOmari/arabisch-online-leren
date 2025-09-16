-- Add bonus points and badge tracking tables

-- Create bonus_points table for teacher-awarded bonus points
CREATE TABLE IF NOT EXISTS public.bonus_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  niveau_id UUID NOT NULL REFERENCES niveaus(id) ON DELETE CASCADE,
  awarded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL CHECK (points > 0 AND points <= 100),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, niveau_id, awarded_by)
);

-- Create awarded_badges table for tracking earned badges
CREATE TABLE IF NOT EXISTS public.awarded_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  niveau_id UUID NOT NULL REFERENCES niveaus(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'automatic' or 'teacher'
  badge_id TEXT NOT NULL, -- identifier like 'points_100', 'points_200', etc.
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  points_threshold INTEGER, -- for automatic badges
  awarded_by UUID REFERENCES profiles(id), -- for teacher badges
  reason TEXT, -- for teacher badges
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, niveau_id, badge_id)
);

-- Enable RLS on new tables
ALTER TABLE public.bonus_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awarded_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for bonus_points
CREATE POLICY "Students can view their own bonus points" 
ON public.bonus_points 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can award bonus points for their niveaus" 
ON public.bonus_points 
FOR INSERT 
WITH CHECK (
  awarded_by = auth.uid() AND
  niveau_id IN (
    SELECT n.id FROM niveaus n 
    JOIN klassen k ON n.class_id = k.id 
    WHERE k.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view bonus points for their niveaus" 
ON public.bonus_points 
FOR SELECT 
USING (
  niveau_id IN (
    SELECT n.id FROM niveaus n 
    JOIN klassen k ON n.class_id = k.id 
    WHERE k.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all bonus points" 
ON public.bonus_points 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- RLS policies for awarded_badges
CREATE POLICY "Students can view their own badges" 
ON public.awarded_badges 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can award badges for their niveaus" 
ON public.awarded_badges 
FOR INSERT 
WITH CHECK (
  awarded_by = auth.uid() AND
  niveau_id IN (
    SELECT n.id FROM niveaus n 
    JOIN klassen k ON n.class_id = k.id 
    WHERE k.teacher_id = auth.uid()
  )
);

CREATE POLICY "System can award automatic badges" 
ON public.awarded_badges 
FOR INSERT 
WITH CHECK (badge_type = 'automatic' AND awarded_by IS NULL);

CREATE POLICY "Teachers can view badges for their niveaus" 
ON public.awarded_badges 
FOR SELECT 
USING (
  niveau_id IN (
    SELECT n.id FROM niveaus n 
    JOIN klassen k ON n.class_id = k.id 
    WHERE k.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all badges" 
ON public.awarded_badges 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Enhanced progress update function to include bonus points
CREATE OR REPLACE FUNCTION public.update_student_progress_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create triggers for the enhanced function
DROP TRIGGER IF EXISTS update_progress_on_task_submission ON task_submissions;
DROP TRIGGER IF EXISTS update_progress_on_answer ON antwoorden;

CREATE TRIGGER update_progress_on_task_submission
  AFTER INSERT OR UPDATE ON task_submissions
  FOR EACH ROW EXECUTE FUNCTION update_student_progress_enhanced();

CREATE TRIGGER update_progress_on_answer
  AFTER INSERT OR UPDATE ON antwoorden
  FOR EACH ROW EXECUTE FUNCTION update_student_progress_enhanced();

-- Function to get total points including bonus points
CREATE OR REPLACE FUNCTION public.get_total_niveau_points(p_student_id UUID, p_niveau_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
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