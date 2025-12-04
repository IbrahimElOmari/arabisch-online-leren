-- =============================================
-- AUTOMATED SECURITY FIX: Security Definer Views + Function Search Path
-- =============================================

-- Fix 1: Convert Security Definer Views to Security Invoker

-- 1. conversation_last_messages
DROP VIEW IF EXISTS public.conversation_last_messages;
CREATE VIEW public.conversation_last_messages 
WITH (security_invoker = true) AS
SELECT DISTINCT ON (m.conversation_id) 
    m.conversation_id,
    m.id AS message_id,
    m.content,
    m.created_at,
    m.sender_id,
    p.full_name AS sender_name
FROM messages m
JOIN profiles p ON p.id = m.sender_id
ORDER BY m.conversation_id, m.created_at DESC;

-- 2. conversation_unread_counts
DROP VIEW IF EXISTS public.conversation_unread_counts;
CREATE VIEW public.conversation_unread_counts 
WITH (security_invoker = true) AS
SELECT 
    cp.conversation_id,
    cp.user_id,
    count(m.id) AS unread_count
FROM conversation_participants cp
LEFT JOIN messages m ON m.conversation_id = cp.conversation_id
LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = cp.user_id
WHERE m.sender_id <> cp.user_id AND mr.read_at IS NULL
GROUP BY cp.conversation_id, cp.user_id;

-- 3. global_search_index
DROP VIEW IF EXISTS public.global_search_index;
CREATE VIEW public.global_search_index 
WITH (security_invoker = true) AS
SELECT 'forum_thread'::text AS entity_type,
    ft.id AS entity_id,
    ft.title,
    ft.body,
    ft.class_id,
    ft.created_at,
    ft.tsv
FROM forum_threads ft
WHERE ft.title IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) 
       OR is_teacher_of_class(auth.uid(), ft.class_id) 
       OR is_enrolled_in_class(auth.uid(), ft.class_id))
UNION ALL
SELECT 'forum_post'::text AS entity_type,
    fp.id AS entity_id,
    fp.titel AS title,
    fp.inhoud AS body,
    fp.class_id,
    fp.created_at,
    fp.tsv
FROM forum_posts fp
WHERE fp.titel IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) 
       OR is_teacher_of_class(auth.uid(), fp.class_id) 
       OR is_enrolled_in_class(auth.uid(), fp.class_id))
UNION ALL
SELECT 'lesson'::text AS entity_type,
    l.id AS entity_id,
    l.title,
    NULL::text AS body,
    l.class_id,
    l.created_at,
    l.tsv
FROM lessen l
WHERE l.title IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) 
       OR is_teacher_of_class(auth.uid(), l.class_id) 
       OR is_enrolled_in_class(auth.uid(), l.class_id))
UNION ALL
SELECT 'profile'::text AS entity_type,
    p.id AS entity_id,
    p.full_name AS title,
    NULL::text AS body,
    NULL::uuid AS class_id,
    p.created_at,
    p.tsv
FROM profiles p
WHERE p.id = auth.uid() AND p.full_name IS NOT NULL;

-- 4. student_analytics_summary
DROP VIEW IF EXISTS public.student_analytics_summary;
CREATE VIEW public.student_analytics_summary 
WITH (security_invoker = true) AS
SELECT 
    la.student_id,
    la.module_id,
    la.niveau_id,
    avg(la.accuracy_rate) AS avg_accuracy,
    count(DISTINCT la.topic) AS topics_covered,
    array_agg(DISTINCT weak.area) FILTER (WHERE weak.area IS NOT NULL) AS all_weak_areas,
    array_agg(DISTINCT strong.area) FILTER (WHERE strong.area IS NOT NULL) AS all_strong_areas,
    max(la.last_updated) AS last_activity
FROM learning_analytics la
LEFT JOIN LATERAL unnest(la.weak_areas) weak(area) ON true
LEFT JOIN LATERAL unnest(la.strong_areas) strong(area) ON true
GROUP BY la.student_id, la.module_id, la.niveau_id;

-- 5. support_ticket_stats
DROP VIEW IF EXISTS public.support_ticket_stats;
CREATE VIEW public.support_ticket_stats 
WITH (security_invoker = true) AS
SELECT 
    assigned_to,
    status,
    priority,
    count(*) AS ticket_count,
    avg((EXTRACT(epoch FROM (resolved_at - created_at)) / 3600::numeric)) AS avg_resolution_hours,
    avg(satisfaction_rating) AS avg_satisfaction,
    count(*) FILTER (WHERE sla_deadline < CURRENT_TIMESTAMP AND status <> ALL (ARRAY['resolved'::text, 'closed'::text])) AS sla_breaches
FROM support_tickets st
GROUP BY assigned_to, status, priority;

-- Fix 2: Add search_path to is_service_role function
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role',
    false
  );
$$;