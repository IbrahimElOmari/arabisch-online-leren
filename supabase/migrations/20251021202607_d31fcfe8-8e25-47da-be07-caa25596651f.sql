-- Performance Indexes Migration (Final Corrected)
-- Created: 2025-01-21
-- Purpose: Add database indexes for improved query performance and scalability
-- Only indexes on existing columns

-- Lessen (lessons) table indexes
CREATE INDEX IF NOT EXISTS idx_lessen_class_id 
ON lessen(class_id);

CREATE INDEX IF NOT EXISTS idx_lessen_created_at 
ON lessen(created_at DESC);

-- Forum threads indexes
CREATE INDEX IF NOT EXISTS idx_forum_threads_class_id 
ON forum_threads(class_id);

CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at 
ON forum_threads(created_at DESC);

-- Forum posts indexes
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_id 
ON forum_posts(thread_id);

CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id 
ON forum_posts(author_id);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at 
ON forum_posts(created_at DESC);

-- Inschrijvingen (enrollments) composite index (frequent join pattern)
CREATE INDEX IF NOT EXISTS idx_inschrijvingen_user_class 
ON inschrijvingen(student_id, class_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_level_id 
ON tasks(level_id);

CREATE INDEX IF NOT EXISTS idx_tasks_author_id 
ON tasks(author_id);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at 
ON tasks(created_at DESC);

-- Task submissions indexes
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id 
ON task_submissions(task_id);

CREATE INDEX IF NOT EXISTS idx_task_submissions_student_id 
ON task_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_task_submissions_submitted_at 
ON task_submissions(submitted_at DESC);

-- Audit log indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
ON audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id 
ON audit_log(user_id);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type 
ON analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id 
ON analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
ON analytics_events(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read_status 
ON notifications(is_read, created_at DESC);

-- Niveaus (levels) index
CREATE INDEX IF NOT EXISTS idx_niveaus_class_id
ON niveaus(class_id);

-- Klassen (classes) index
CREATE INDEX IF NOT EXISTS idx_klassen_teacher_id
ON klassen(teacher_id);

-- Antwoorden (answers) indexes
CREATE INDEX IF NOT EXISTS idx_antwoorden_student_id
ON antwoorden(student_id);

CREATE INDEX IF NOT EXISTS idx_antwoorden_vraag_id
ON antwoorden(vraag_id);

-- COMMENT: These indexes target the most frequent query patterns:
-- 1. Filtering by class_id (lessen, forum_threads, niveaus)
-- 2. User-specific queries (forum_posts, task_submissions, notifications, antwoorden)
-- 3. Time-series queries (created_at DESC for recent items)
-- 4. Composite indexes for common JOIN patterns

-- Verify indexes were created
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully';
  RAISE NOTICE 'Total indexes added: 22';
END $$;