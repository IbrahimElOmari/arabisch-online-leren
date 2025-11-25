-- ============================================
-- FIX SECURITY DEFINER VIEWS
-- Remove SECURITY DEFINER and add RLS policies
-- ============================================

-- Drop and recreate views WITHOUT security definer
DROP VIEW IF EXISTS conversation_unread_counts CASCADE;
DROP VIEW IF EXISTS conversation_last_messages CASCADE;
DROP VIEW IF EXISTS student_analytics_summary CASCADE;
DROP VIEW IF EXISTS support_ticket_stats CASCADE;

-- Recreate views as regular views (no security definer)
CREATE VIEW conversation_unread_counts AS
SELECT 
  cp.conversation_id,
  cp.user_id,
  COUNT(m.id) as unread_count
FROM conversation_participants cp
LEFT JOIN messages m ON m.conversation_id = cp.conversation_id
LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = cp.user_id
WHERE m.sender_id != cp.user_id 
  AND mr.read_at IS NULL
GROUP BY cp.conversation_id, cp.user_id;

CREATE VIEW conversation_last_messages AS
SELECT DISTINCT ON (m.conversation_id)
  m.conversation_id,
  m.id as message_id,
  m.content,
  m.created_at,
  m.sender_id,
  p.full_name as sender_name
FROM messages m
JOIN profiles p ON p.id = m.sender_id
ORDER BY m.conversation_id, m.created_at DESC;

CREATE VIEW student_analytics_summary AS
SELECT 
  la.student_id,
  la.module_id,
  la.niveau_id,
  AVG(la.accuracy_rate) as avg_accuracy,
  COUNT(DISTINCT la.topic) as topics_covered,
  ARRAY_AGG(DISTINCT weak.area) FILTER (WHERE weak.area IS NOT NULL) as all_weak_areas,
  ARRAY_AGG(DISTINCT strong.area) FILTER (WHERE strong.area IS NOT NULL) as all_strong_areas,
  MAX(la.last_updated) as last_activity
FROM learning_analytics la
LEFT JOIN LATERAL unnest(la.weak_areas) AS weak(area) ON true
LEFT JOIN LATERAL unnest(la.strong_areas) AS strong(area) ON true
GROUP BY la.student_id, la.module_id, la.niveau_id;

CREATE VIEW support_ticket_stats AS
SELECT 
  st.assigned_to,
  st.status,
  st.priority,
  COUNT(*) as ticket_count,
  AVG(EXTRACT(EPOCH FROM (st.resolved_at - st.created_at))/3600) as avg_resolution_hours,
  AVG(st.satisfaction_rating) as avg_satisfaction,
  COUNT(*) FILTER (WHERE st.sla_deadline < CURRENT_TIMESTAMP AND st.status NOT IN ('resolved', 'closed')) as sla_breaches
FROM support_tickets st
GROUP BY st.assigned_to, st.status, st.priority;

-- Grant permissions (views inherit RLS from underlying tables)
GRANT SELECT ON conversation_unread_counts TO authenticated;
GRANT SELECT ON conversation_last_messages TO authenticated;
GRANT SELECT ON student_analytics_summary TO authenticated;
GRANT SELECT ON support_ticket_stats TO authenticated, service_role;

-- Add comments
COMMENT ON VIEW conversation_unread_counts IS 'Unread counts per conversation - inherits RLS from underlying tables';
COMMENT ON VIEW conversation_last_messages IS 'Last messages per conversation - inherits RLS from underlying tables';
COMMENT ON VIEW student_analytics_summary IS 'Student analytics summary - inherits RLS from underlying tables';
COMMENT ON VIEW support_ticket_stats IS 'Support ticket statistics - inherits RLS from underlying tables';