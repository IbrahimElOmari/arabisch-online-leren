-- Create student_niveau_progress table for tracking progress per level
CREATE TABLE public.student_niveau_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  niveau_id UUID NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  completed_questions INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, niveau_id)
);

-- Enable RLS
ALTER TABLE public.student_niveau_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their own progress" 
ON public.student_niveau_progress 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own progress" 
ON public.student_niveau_progress 
FOR UPDATE 
USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own progress" 
ON public.student_niveau_progress 
FOR INSERT 
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view progress for their niveaus" 
ON public.student_niveau_progress 
FOR SELECT 
USING (niveau_id IN (
  SELECT n.id 
  FROM niveaus n 
  JOIN klassen k ON n.class_id = k.id 
  WHERE k.teacher_id = auth.uid()
));

CREATE POLICY "Admins can manage all progress" 
ON public.student_niveau_progress 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Function to update progress and check completion
CREATE OR REPLACE FUNCTION public.update_student_progress()
RETURNS TRIGGER AS $$
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

  -- Check if level is completed (1000 points)
  UPDATE public.student_niveau_progress 
  SET is_completed = TRUE, completed_at = now()
  WHERE student_id = NEW.student_id 
    AND niveau_id = progress_record.niveau_id 
    AND total_points >= 1000 
    AND is_completed = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic progress tracking
CREATE TRIGGER update_progress_on_task_submission
  AFTER INSERT OR UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_progress();

CREATE TRIGGER update_progress_on_answer_submission
  AFTER INSERT OR UPDATE ON public.antwoorden
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_progress();

-- Add updated_at trigger to progress table
CREATE TRIGGER update_student_niveau_progress_updated_at
  BEFORE UPDATE ON public.student_niveau_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();