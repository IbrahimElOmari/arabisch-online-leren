-- =====================================================
-- COMPREHENSIVE SECURITY VALIDATION SCRIPT
-- Run after MANUAL-SECURITY-MIGRATION.sql
-- =====================================================

\echo '🔒 SECURITY VALIDATION REPORT'
\echo '====================================='
\echo ''

-- ========== 1. RLS STATUS CHECK ==========
\echo '📋 1. ROW LEVEL SECURITY STATUS'
\echo '-------------------------------------'

SELECT 
  c.relname as "Table",
  CASE 
    WHEN c.relrowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as "RLS Status",
  (SELECT COUNT(*) 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename = c.relname) as "Policy Count"
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
AND c.relname NOT LIKE 'pg_%'
AND c.relname NOT LIKE 'sql_%'
ORDER BY 
  CASE WHEN c.relrowsecurity THEN 0 ELSE 1 END,
  c.relname;

\echo ''

-- ========== 2. CRITICAL TABLES RLS VERIFICATION ==========
\echo '🚨 2. CRITICAL TABLES RLS VERIFICATION'
\echo '-------------------------------------'

WITH critical_tables AS (
  SELECT unnest(ARRAY[
    'completion_criteria',
    'scheduled_messages',
    'module_class_teachers',
    'profiles',
    'antwoorden',
    'payments',
    'enrollments',
    'forum_posts',
    'content_library',
    'system_metrics',
    'notifications',
    'audit_log',
    'student_game_profiles',
    'challenges',
    'badges'
  ]) as table_name
)
SELECT 
  ct.table_name as "Critical Table",
  COALESCE(
    (SELECT CASE 
       WHEN c.relrowsecurity THEN '✅ SECURED'
       ELSE '❌ EXPOSED'
     END
     FROM pg_class c 
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = ct.table_name),
    '⚠️ NOT FOUND'
  ) as "Status",
  COALESCE(
    (SELECT COUNT(*)::text || ' policies'
     FROM pg_policies 
     WHERE schemaname = 'public' AND tablename = ct.table_name),
    '0 policies'
  ) as "Protection"
FROM critical_tables ct
ORDER BY "Status", ct.table_name;

\echo ''

-- ========== 3. SECURITY DEFINER FUNCTIONS CHECK ==========
\echo '🔐 3. SECURITY DEFINER FUNCTIONS'
\echo '-------------------------------------'

SELECT 
  p.proname as "Function Name",
  pg_get_function_arguments(p.oid) as "Arguments",
  CASE 
    WHEN p.proconfig IS NULL THEN '❌ NO search_path'
    WHEN EXISTS (
      SELECT 1 FROM unnest(p.proconfig) AS c 
      WHERE c LIKE 'search_path=%'
    ) THEN '✅ search_path set: ' || (
      SELECT c FROM unnest(p.proconfig) AS c 
      WHERE c LIKE 'search_path=%' 
      LIMIT 1
    )
    ELSE '⚠️ CHECK config'
  END as "Security Status"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true
ORDER BY 
  CASE 
    WHEN p.proconfig IS NULL THEN 2
    WHEN EXISTS (SELECT 1 FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%') THEN 0
    ELSE 1
  END,
  p.proname;

\echo ''

-- ========== 4. POLICY COVERAGE BY TABLE ==========
\echo '📜 4. RLS POLICY COVERAGE'
\echo '-------------------------------------'

SELECT 
  tablename as "Table",
  COUNT(*) as "Total Policies",
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as "SELECT",
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as "INSERT",
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as "UPDATE",
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as "DELETE",
  COUNT(*) FILTER (WHERE cmd = 'ALL') as "ALL"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 0
ORDER BY "Total Policies" DESC, tablename;

\echo ''

-- ========== 5. DANGEROUS POLICIES DETECTION ==========
\echo '⚠️  5. POTENTIALLY DANGEROUS POLICIES'
\echo '-------------------------------------'

SELECT 
  tablename as "Table",
  policyname as "Policy Name",
  cmd as "Command",
  CASE 
    WHEN qual = 'true' THEN '🚨 ALLOWS ALL (true)'
    WHEN qual LIKE '%true%' THEN '⚠️ Contains true condition'
    ELSE '✅ Has restrictions'
  END as "Risk Level",
  qual as "Condition"
FROM pg_policies
WHERE schemaname = 'public'
AND (qual = 'true' OR qual LIKE '%true%')
ORDER BY 
  CASE 
    WHEN qual = 'true' THEN 0
    ELSE 1
  END,
  tablename;

\echo ''

-- ========== 6. FOREIGN KEY CONSTRAINTS ==========
\echo '🔗 6. FOREIGN KEY INTEGRITY'
\echo '-------------------------------------'

SELECT 
  tc.table_name as "Table",
  kcu.column_name as "Column",
  ccu.table_name AS "References Table",
  ccu.column_name AS "References Column",
  tc.constraint_name as "Constraint Name"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''

-- ========== 7. TABLES WITHOUT OWNER CHECKS ==========
\echo '👤 7. TABLES WITHOUT USER OWNERSHIP CHECK'
\echo '-------------------------------------'

WITH tables_with_user_cols AS (
  SELECT 
    c.relname as table_name,
    STRING_AGG(a.attname, ', ') as user_columns
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_attribute a ON a.attrelid = c.oid
  WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND a.attname SIMILAR TO '%(user_id|student_id|teacher_id|author_id|sender_id|receiver_id|actor_id)%'
  AND NOT a.attisdropped
  GROUP BY c.relname
),
tables_without_user_policies AS (
  SELECT DISTINCT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
  AND (
    qual NOT SIMILAR TO '%(auth.uid|user_id|student_id|teacher_id|author_id)%'
    OR qual IS NULL
  )
)
SELECT 
  twu.table_name as "Table",
  twu.user_columns as "User Columns",
  CASE 
    WHEN twp.tablename IS NOT NULL THEN '⚠️ Missing user checks'
    ELSE '✅ Has user checks'
  END as "Policy Status"
FROM tables_with_user_cols twu
LEFT JOIN tables_without_user_policies twp ON twp.tablename = twu.table_name
ORDER BY 
  CASE WHEN twp.tablename IS NOT NULL THEN 0 ELSE 1 END,
  twu.table_name;

\echo ''

-- ========== 8. AUDIT LOG VERIFICATION ==========
\echo '📝 8. AUDIT LOG RECENT SECURITY EVENTS'
\echo '-------------------------------------'

SELECT 
  created_at as "Timestamp",
  actie as "Action",
  severity as "Severity",
  details->>'migration' as "Migration",
  details->>'tables_secured' as "Tables Secured"
FROM audit_log
WHERE actie LIKE '%SECURITY%'
OR actie LIKE '%MIGRATION%'
ORDER BY created_at DESC
LIMIT 10;

\echo ''

-- ========== 9. PRIVILEGE ESCALATION RISKS ==========
\echo '🚨 9. PRIVILEGE ESCALATION RISKS'
\echo '-------------------------------------'

-- Check if roles are stored in profiles (BAD!)
SELECT 
  'profiles' as "Table",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'role'
    ) THEN '⚠️ Role column exists - RISK if used for authorization'
    ELSE '✅ No role column'
  END as "Status",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'role'
    ) THEN 'Use user_roles table with has_role() function instead'
    ELSE NULL
  END as "Recommendation"

UNION ALL

-- Check user_roles table exists (GOOD!)
SELECT 
  'user_roles' as "Table",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_roles'
    ) THEN '✅ User roles table exists'
    ELSE '❌ Missing user_roles table'
  END as "Status",
  NULL as "Recommendation";

\echo ''

-- ========== 10. SUMMARY SCORE ==========
\echo '📊 10. SECURITY SCORE SUMMARY'
\echo '-------------------------------------'

WITH security_checks AS (
  SELECT 
    'RLS Enabled on Critical Tables' as check_name,
    (SELECT COUNT(*) FROM (
      SELECT unnest(ARRAY[
        'completion_criteria', 'scheduled_messages', 'module_class_teachers',
        'profiles', 'antwoorden', 'payments', 'enrollments', 'forum_posts'
      ])
    ) t) as total,
    (SELECT COUNT(*) FROM pg_class c 
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
     AND c.relname IN (
       'completion_criteria', 'scheduled_messages', 'module_class_teachers',
       'profiles', 'antwoorden', 'payments', 'enrollments', 'forum_posts'
     )
     AND c.relrowsecurity = true) as passed
  
  UNION ALL
  
  SELECT 
    'Security Definer Functions Hardened' as check_name,
    (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON p.pronamespace = n.oid
     WHERE n.nspname = 'public' AND p.prosecdef = true) as total,
    (SELECT COUNT(*) FROM pg_proc p
     JOIN pg_namespace n ON p.pronamespace = n.oid
     WHERE n.nspname = 'public' 
     AND p.prosecdef = true
     AND EXISTS (
       SELECT 1 FROM unnest(p.proconfig) AS c 
       WHERE c LIKE 'search_path=%'
     )) as passed
)
SELECT 
  check_name as "Security Check",
  passed || ' / ' || total as "Score",
  ROUND(100.0 * passed / NULLIF(total, 0), 1) || '%' as "Percentage",
  CASE 
    WHEN passed = total THEN '✅ PASS'
    WHEN passed >= total * 0.8 THEN '⚠️ PARTIAL'
    ELSE '❌ FAIL'
  END as "Status"
FROM security_checks;

\echo ''
\echo '====================================='
\echo '✅ Security validation complete!'
\echo '====================================='
\echo ''
\echo '⚠️  IMPORTANT: Review all ❌ and ⚠️  items above'
\echo '📝 Document any remaining issues in VALIDATION-CHECKLIST.md'
\echo ''
