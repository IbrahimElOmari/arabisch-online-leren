-- ============================================
-- DATABASE VIEWS & INDEX OPTIMIZATION (CORRECTED)
-- Taak 12: Performance Optimization
-- Column names verified against schema
-- ============================================

-- View: Unread message counts per conversation per user
CREATE OR REPLACE VIEW conversation_unread_counts AS
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

-- View: Last message per conversation with sender info
CREATE OR REPLACE VIEW conversation_last_messages AS
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

-- View: Student analytics aggregation
CREATE OR REPLACE VIEW student_analytics_summary AS
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

-- View: Support ticket statistics
CREATE OR REPLACE VIEW support_ticket_stats AS
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

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Chat & Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_reads_message_user 
  ON message_reads(message_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user 
  ON conversation_participants(user_id);

-- Learning Analytics
CREATE INDEX IF NOT EXISTS idx_learning_analytics_student_module 
  ON learning_analytics(student_id, module_id);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_student_started 
  ON practice_sessions(student_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_antwoorden_student_created 
  ON antwoorden(student_id, created_at DESC);

-- Support & Moderation
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned 
  ON support_tickets(assigned_to) 
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority 
  ON support_tickets(status, priority);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user_expires 
  ON user_warnings(user_id, expires_at) 
  WHERE acknowledged = false;

CREATE INDEX IF NOT EXISTS idx_ban_history_active 
  ON ban_history(user_id, is_active) 
  WHERE is_active = true;

-- Forum & Content
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_created 
  ON forum_posts(thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_threads_class_created 
  ON forum_threads(class_id, created_at DESC);

-- Payments & Enrollments
CREATE INDEX IF NOT EXISTS idx_payments_enrollment 
  ON payments(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_status 
  ON enrollments(student_id, status);

-- Audit & Security
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created 
  ON audit_logs(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_scans_status_bucket 
  ON file_scans(scan_status, storage_bucket);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON VIEW conversation_unread_counts IS 
'Real-time unread message counts per conversation per user. Used for notification badges.';

COMMENT ON VIEW conversation_last_messages IS 
'Latest message per conversation with sender details. Used for conversation list previews.';

COMMENT ON VIEW student_analytics_summary IS 
'Aggregated learning analytics per student-module-niveau. Used for progress dashboards.';

COMMENT ON VIEW support_ticket_stats IS 
'Support team performance metrics. Used for admin dashboards and SLA monitoring.';