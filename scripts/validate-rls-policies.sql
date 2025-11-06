-- PR4-PR6 RLS Policy Validation Script
-- Run this in Supabase SQL Editor to generate RLS evidence

-- Check RLS is enabled on all critical tables
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN (
  'placement_results',
  'placement_tests',
  'waiting_list',
  'forum_posts',
  'forum_post_views',
  'content_library',
  'content_templates',
  'content_versions',
  'payments',
  'enrollments'
)
ORDER BY c.relname;

-- List all policies for critical tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'placement_results',
  'placement_tests', 
  'waiting_list',
  'forum_posts',
  'forum_post_views',
  'content_library',
  'content_templates',
  'content_versions',
  'payments',
  'enrollments'
)
ORDER BY tablename, policyname;

-- Check for tables without RLS
SELECT 
  c.relname as table_without_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
AND NOT c.relrowsecurity
AND c.relname NOT LIKE 'pg_%'
AND c.relname NOT LIKE 'sql_%'
ORDER BY c.relname;

-- Audit log event types validation
SELECT 
  actie as event_type,
  COUNT(*) as event_count,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM audit_log
WHERE actie IN (
  'PLACEMENT_GRADED',
  'CLASS_ASSIGNED',
  'FORUM_POST_CREATED',
  'FORUM_POST_UPDATED', 
  'FORUM_POST_DELETED',
  'FORUM_POST_REPORTED',
  'CONTENT_CREATED',
  'CONTENT_UPDATED',
  'CONTENT_PUBLISHED',
  'VERSION_ROLLED_BACK'
)
GROUP BY actie
ORDER BY actie;

-- Recent audit log samples
SELECT 
  id,
  user_id,
  actie,
  resource_type,
  resource_id,
  severity,
  created_at
FROM audit_log
WHERE actie IN (
  'PLACEMENT_GRADED',
  'CLASS_ASSIGNED',
  'FORUM_POST_CREATED',
  'FORUM_POST_UPDATED',
  'FORUM_POST_DELETED', 
  'FORUM_POST_REPORTED',
  'CONTENT_CREATED',
  'CONTENT_UPDATED',
  'CONTENT_PUBLISHED',
  'VERSION_ROLLED_BACK'
)
ORDER BY created_at DESC
LIMIT 50;
