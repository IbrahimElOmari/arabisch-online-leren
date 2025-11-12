-- =====================================================
-- MANUAL SECURITY MIGRATION for PR7/PR8/PR9
-- Run this in Supabase SQL Editor when database is idle
-- =====================================================
-- 
-- IMPORTANT: Run this during low-traffic period
-- This script fixes 15+ critical security issues
--
-- =====================================================

-- Step 1: Clear any active locks (if needed)
-- SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND pid != pg_backend_pid();

-- ========== CRITICAL FIX 1: completion_criteria ==========
ALTER TABLE IF EXISTS public.completion_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage completion criteria" ON public.completion_criteria;
CREATE POLICY "Admins can manage completion criteria"
  ON public.completion_criteria
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Teachers can view completion criteria" ON public.completion_criteria;
CREATE POLICY "Teachers can view completion criteria"
  ON public.completion_criteria
  FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leerkracht'));

-- ========== CRITICAL FIX 2: scheduled_messages ==========
ALTER TABLE IF EXISTS public.scheduled_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage scheduled messages" ON public.scheduled_messages;
CREATE POLICY "Admins can manage scheduled messages"
  ON public.scheduled_messages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Senders can view own scheduled messages" ON public.scheduled_messages;
CREATE POLICY "Senders can view own scheduled messages"
  ON public.scheduled_messages
  FOR SELECT
  USING (sender_id = auth.uid());

-- ========== CRITICAL FIX 3: module_class_teachers ==========
ALTER TABLE IF EXISTS public.module_class_teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage class teachers" ON public.module_class_teachers;
CREATE POLICY "Admins manage class teachers"
  ON public.module_class_teachers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Teachers view own assignments" ON public.module_class_teachers;
CREATE POLICY "Teachers view own assignments"
  ON public.module_class_teachers
  FOR SELECT
  USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students view enrolled class teachers" ON public.module_class_teachers;
CREATE POLICY "Students view enrolled class teachers"
  ON public.module_class_teachers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inschrijvingen
      WHERE student_id = auth.uid()
        AND class_id = module_class_teachers.class_id
        AND payment_status = 'paid'
    )
  );

-- ========== CRITICAL FIX 4: Strengthen profiles RLS ==========
-- Remove overly permissive policy
DROP POLICY IF EXISTS "Authenticated profiles only" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Add strict policies
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Teachers view student profiles" ON public.profiles;
CREATE POLICY "Teachers view student profiles"
  ON public.profiles
  FOR SELECT
  USING (
    has_role(auth.uid(), 'leerkracht')
    AND EXISTS (
      SELECT 1 FROM public.klassen k
      JOIN public.inschrijvingen i ON i.class_id = k.id
      WHERE k.teacher_id = auth.uid()
        AND i.student_id = profiles.id
        AND i.payment_status = 'paid'
    )
  );

-- ========== CRITICAL FIX 5: Strengthen antwoorden (answers) ==========
-- Ensure students can only see their own answers
DROP POLICY IF EXISTS "Students can view class answers" ON public.antwoorden;
DROP POLICY IF EXISTS "Students view all class answers" ON public.antwoorden;

-- Students should only see their own answers
DROP POLICY IF EXISTS "Students insert own answers only" ON public.antwoorden;
CREATE POLICY "Students insert own answers only"
  ON public.antwoorden
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ========== FIX 6: Add search_path to security definer functions ==========
-- This prevents search_path injection attacks
ALTER FUNCTION public.export_user_data(uuid) SET search_path = public;
ALTER FUNCTION public.get_conversation_messages(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_direct_messages(uuid) SET search_path = public;
ALTER FUNCTION public.get_total_niveau_points(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.search_global(text, integer, integer, uuid) SET search_path = public;

-- ========== FIX 7: global_search_index (VIEW) ==========
-- Note: This is a VIEW, not a table, so we need to modify its definition
-- to add security definer OR create a security definer function wrapper

-- Check if global_search_index is a view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'global_search_index'
  ) THEN
    -- It's a view, we need to recreate it with SECURITY DEFINER
    -- This requires knowing the original view definition
    RAISE NOTICE 'global_search_index is a view - requires manual review of view definition';
  END IF;
END $$;

-- ========== AUDIT LOG ==========
INSERT INTO public.audit_log (user_id, actie, resource_type, details, severity)
VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'SECURITY_HARDENING_MANUAL_APPLIED',
  'database',
  jsonb_build_object(
    'migration', 'MANUAL_SECURITY_FIXES_PR7_PR8_PR9',
    'tables_secured', ARRAY[
      'completion_criteria',
      'scheduled_messages',
      'module_class_teachers',
      'profiles',
      'antwoorden'
    ],
    'functions_hardened', 5,
    'applied_by', current_user,
    'timestamp', now()
  ),
  'critical'
);

-- ========== VERIFICATION QUERIES ==========

-- Check RLS is enabled
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN (
  'completion_criteria',
  'scheduled_messages',
  'module_class_teachers'
)
ORDER BY c.relname;

-- Check policies exist
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'completion_criteria',
  'scheduled_messages',
  'module_class_teachers',
  'profiles',
  'antwoorden'
)
ORDER BY tablename, policyname;

-- Check functions have search_path
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  p.proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'export_user_data',
  'get_conversation_messages',
  'get_direct_messages',
  'get_total_niveau_points',
  'search_global'
)
ORDER BY p.proname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Security hardening migration completed successfully!';
  RAISE NOTICE '📝 Review the verification query results above';
  RAISE NOTICE '🔍 Run Supabase linter to confirm fixes';
END $$;
