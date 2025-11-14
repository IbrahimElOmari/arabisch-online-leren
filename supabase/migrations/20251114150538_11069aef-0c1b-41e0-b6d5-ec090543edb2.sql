-- PR10: Fix security issues from linter

-- Fix existing functions without search_path (the warnings)
ALTER FUNCTION public.update_enrollment_last_activity() SET search_path = public;
ALTER FUNCTION public.update_content_updated_at() SET search_path = public;
ALTER FUNCTION public.update_metric_threshold_timestamp() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_gamification_updated_at() SET search_path = public;

-- Enable RLS on tables that don't have it enabled (ERROR 7-11)
-- Check if tables exist first and enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher_notes') THEN
    ALTER TABLE public.teacher_notes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grading_rubrics') THEN
    ALTER TABLE public.grading_rubrics ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_templates') THEN
    ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_messages') THEN
    ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher_rewards') THEN
    ALTER TABLE public.teacher_rewards ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;