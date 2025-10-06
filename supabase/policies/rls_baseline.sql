-- ============================================
-- RLS BASELINE POLICIES
-- ============================================
-- This file contains baseline Row Level Security policies
-- for user-data tables to ensure data isolation.
--
-- CRITICAL: These policies enforce that users can only
-- access their own data. Apply to all tables containing
-- user-specific information.
--
-- Usage: Review existing tables and apply these patterns
-- where RLS is missing or incomplete.
-- ============================================

-- Example: User Progress Table (adjust table name as needed)
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.user_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (idempotent)
DROP POLICY IF EXISTS "own_progress_select" ON public.user_progress;
DROP POLICY IF EXISTS "own_progress_insert" ON public.user_progress;
DROP POLICY IF EXISTS "own_progress_update" ON public.user_progress;
DROP POLICY IF EXISTS "own_progress_delete" ON public.user_progress;

-- SELECT: Users can only read their own progress
CREATE POLICY "own_progress_select" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT: Users can only create their own progress records
CREATE POLICY "own_progress_insert" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own progress
CREATE POLICY "own_progress_update" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own progress
CREATE POLICY "own_progress_delete" 
ON public.user_progress 
FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- Example: Task Submissions Table
-- ============================================

ALTER TABLE IF EXISTS public.task_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_submissions_select" ON public.task_submissions;
DROP POLICY IF EXISTS "own_submissions_insert" ON public.task_submissions;
DROP POLICY IF EXISTS "own_submissions_update" ON public.task_submissions;

-- Students can read their own submissions
CREATE POLICY "own_submissions_select" 
ON public.task_submissions 
FOR SELECT 
USING (auth.uid() = student_id);

-- Students can create their own submissions
CREATE POLICY "own_submissions_insert" 
ON public.task_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Students can update their own ungraded submissions
CREATE POLICY "own_submissions_update" 
ON public.task_submissions 
FOR UPDATE 
USING (auth.uid() = student_id AND grade IS NULL);

-- Teachers can view all submissions (requires is_teacher function)
-- Note: This assumes a helper function exists to check teacher role
-- CREATE POLICY "teachers_view_submissions" 
-- ON public.task_submissions 
-- FOR SELECT 
-- USING (is_teacher());

-- ============================================
-- Content Tables (Public Read, Admin Write)
-- ============================================

-- Example: Lessons table (public read, admin/teacher write)
ALTER TABLE IF EXISTS public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_read_all" ON public.lessons;
DROP POLICY IF EXISTS "lessons_modify_admins" ON public.lessons;

-- Anyone can read published lessons
CREATE POLICY "lessons_read_all" 
ON public.lessons 
FOR SELECT 
USING (true);

-- Only admins/teachers can modify lessons
-- Note: This requires a helper function to check admin role
-- CREATE POLICY "lessons_modify_admins" 
-- ON public.lessons 
-- FOR ALL 
-- USING (is_admin() OR is_teacher());

-- ============================================
-- Helper Functions (if not already present)
-- ============================================

-- Function to check if current user is admin
-- CREATE OR REPLACE FUNCTION public.is_admin()
-- RETURNS boolean
-- LANGUAGE sql
-- SECURITY DEFINER
-- STABLE
-- AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid() AND role = 'admin'
--   );
-- $$;

-- Function to check if current user is teacher
-- CREATE OR REPLACE FUNCTION public.is_teacher()
-- RETURNS boolean
-- LANGUAGE sql
-- SECURITY DEFINER
-- STABLE
-- AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid() AND role IN ('teacher', 'admin')
--   );
-- $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after applying policies to verify:

-- 1. Check RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('user_progress', 'task_submissions', 'lessons');

-- 2. List all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- 3. Test policy enforcement (as authenticated user):
-- SET ROLE authenticated;
-- SELECT * FROM public.user_progress WHERE user_id != auth.uid(); -- Should return empty
-- RESET ROLE;
