-- =====================================================
-- RLS Policies voor Nieuwe Tabellen
-- PR13 - Stap 3: Security Hardening
-- =====================================================

-- =====================================================
-- 1. learning_analytics
-- =====================================================

ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;

-- Students can only see their own analytics
CREATE POLICY "Students can view own learning analytics"
ON public.learning_analytics
FOR SELECT
USING (
  auth.uid() = student_id
  OR public.has_role(auth.uid(), 'leerkracht')
  OR public.has_role(auth.uid(), 'admin')
);

-- Only system (via service role) can insert/update
CREATE POLICY "System can insert learning analytics"
ON public.learning_analytics
FOR INSERT
WITH CHECK (public.is_service_role());

CREATE POLICY "System can update learning analytics"
ON public.learning_analytics
FOR UPDATE
USING (public.is_service_role());

-- Only admins can delete
CREATE POLICY "Admins can delete learning analytics"
ON public.learning_analytics
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 2. practice_sessions
-- =====================================================

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- Students can see their own sessions, teachers/admins see all
CREATE POLICY "Students can view own practice sessions"
ON public.practice_sessions
FOR SELECT
USING (
  auth.uid() = student_id
  OR public.has_role(auth.uid(), 'leerkracht')
  OR public.has_role(auth.uid(), 'admin')
);

-- Students can insert their own sessions
CREATE POLICY "Students can create practice sessions"
ON public.practice_sessions
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can update their own sessions, admins can update all
CREATE POLICY "Students can update own practice sessions"
ON public.practice_sessions
FOR UPDATE
USING (
  auth.uid() = student_id
  OR public.has_role(auth.uid(), 'admin')
);

-- Only admins can delete
CREATE POLICY "Admins can delete practice sessions"
ON public.practice_sessions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 3. backup_jobs
-- =====================================================

ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins have access
CREATE POLICY "Only admins can view backup jobs"
ON public.backup_jobs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can create backup jobs"
ON public.backup_jobs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update backup jobs"
ON public.backup_jobs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete backup jobs"
ON public.backup_jobs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 4. audit_logs
-- =====================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only service role can insert (via edge functions)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (public.is_service_role());

-- =====================================================
-- 5. audit_log (oude tabel - ook beveiligen)
-- =====================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Only admins can view audit log"
ON public.audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only service role can insert
CREATE POLICY "System can insert to audit log"
ON public.audit_log
FOR INSERT
WITH CHECK (public.is_service_role());