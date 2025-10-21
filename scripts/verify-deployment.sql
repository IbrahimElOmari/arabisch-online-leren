-- ============================================
-- DEPLOYMENT VERIFICATION SCRIPT
-- ============================================
-- Run dit script in Supabase SQL Editor na deployment
-- om te verificeren dat alle security fixes correct zijn toegepast.
-- ============================================

-- SECTIE 1: Verify global_search_index view
-- ============================================
\echo '🔍 Checking global_search_index view...'

SELECT 
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'global_search_index';

-- Expected: VIEW should exist with enrollment-based access control

-- ============================================
-- SECTIE 2: Verify search_path in SECURITY DEFINER functions
-- ============================================
\echo '🔒 Checking SECURITY DEFINER functions for search_path...'

SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS function_args,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN '✅ SECURE'
    ELSE '❌ VULNERABLE'
  END AS security_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY security_status, function_name;

-- Expected: All functions should show '✅ SECURE'

-- ============================================
-- SECTIE 3: Verify RLS is enabled on critical tables
-- ============================================
\echo '🛡️ Checking RLS status on critical tables...'

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 
    'user_roles',
    'task_submissions',
    'antwoorden',
    'forum_posts',
    'forum_threads',
    'student_niveau_progress',
    'bonus_points',
    'awarded_badges',
    'inschrijvingen',
    'direct_messages',
    'messages',
    'notifications'
  )
ORDER BY rls_status, tablename;

-- Expected: All tables should show '✅ ENABLED'

-- ============================================
-- SECTIE 4: Count RLS policies per table
-- ============================================
\echo '📋 Checking RLS policy count per table...'

SELECT 
  schemaname,
  tablename,
  COUNT(*) AS policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO POLICIES'
    WHEN COUNT(*) < 3 THEN '⚠️ FEW POLICIES'
    ELSE '✅ GOOD COVERAGE'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count ASC, tablename;

-- Expected: Most tables should have multiple policies

-- ============================================
-- SECTIE 5: Test search index security (run as student)
-- ============================================
\echo '🧪 Testing global_search_index access control...'

-- Test 1: Admin can see all content
-- SET ROLE TO authenticated user with admin role first
-- Expected: Returns results from all classes

-- Test 2: Teacher can see own class content  
-- SET ROLE TO authenticated user with teacher role
-- Expected: Returns only results from teacher's classes

-- Test 3: Student can see enrolled class content
-- SET ROLE TO authenticated user with student role  
-- Expected: Returns only results from enrolled classes

-- Manual test queries (replace UUIDs with actual user IDs):
/*
-- As admin:
SET SESSION AUTHORIZATION 'admin-user-id';
SELECT COUNT(*) FROM public.global_search_index;

-- As teacher:  
SET SESSION AUTHORIZATION 'teacher-user-id';
SELECT COUNT(*) FROM public.global_search_index;

-- As student:
SET SESSION AUTHORIZATION 'student-user-id';  
SELECT COUNT(*) FROM public.global_search_index;

-- Reset:
RESET SESSION AUTHORIZATION;
*/

-- ============================================
-- SECTIE 6: Verify user_roles table and functions
-- ============================================
\echo '👥 Checking user_roles infrastructure...'

-- Check if user_roles table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'user_roles'
    ) THEN '✅ user_roles table exists'
    ELSE '❌ user_roles table missing'
  END AS status;

-- Check if has_role function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' 
      AND p.proname = 'has_role'
    ) THEN '✅ has_role() function exists'
    ELSE '❌ has_role() function missing'
  END AS status;

-- Check if get_user_role function exists  
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' 
      AND p.proname = 'get_user_role'
    ) THEN '✅ get_user_role() function exists'
    ELSE '❌ get_user_role() function missing'
  END AS status;

-- ============================================
-- SECTIE 7: Security audit log check
-- ============================================
\echo '📊 Checking recent security events...'

SELECT 
  actie,
  severity,
  COUNT(*) AS event_count,
  MAX(created_at) AS last_occurrence
FROM public.audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY actie, severity
ORDER BY severity DESC, event_count DESC
LIMIT 20;

-- Expected: No critical security events

-- ============================================
-- SECTIE 8: Rate limiting verification
-- ============================================
\echo '⏱️ Checking rate limiting infrastructure...'

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'auth_rate_limits'
    ) THEN '✅ auth_rate_limits table exists'
    ELSE '❌ auth_rate_limits table missing'
  END AS status;

-- Check if check_rate_limit function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' 
      AND p.proname = 'check_rate_limit'
    ) THEN '✅ check_rate_limit() function exists'
    ELSE '❌ check_rate_limit() function missing'
  END AS status;

-- ============================================
-- FINAL SUMMARY
-- ============================================
\echo ''
\echo '============================================'
\echo 'DEPLOYMENT VERIFICATION COMPLETE'
\echo '============================================'
\echo ''
\echo 'Next steps:'
\echo '1. Review any ❌ or ⚠️ items above'
\echo '2. Test user flows as different roles (admin/teacher/student)'
\echo '3. Monitor audit_log for security events'
\echo '4. Run E2E security tests: pnpm e2e --grep security'
\echo '5. Update Supabase Dashboard settings:'
\echo '   - Enable HaveIBeenPwned password checking'
\echo '   - Set OTP expiry to 600 seconds'
\echo '   - Configure email rate limiting'
\echo ''
