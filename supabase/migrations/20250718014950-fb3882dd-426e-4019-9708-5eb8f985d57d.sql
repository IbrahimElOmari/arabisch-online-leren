-- Enhanced security monitoring and audit capabilities

-- Add additional audit log fields for better security tracking
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS old_values JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS new_values JSONB;

-- Security monitoring views
CREATE OR REPLACE VIEW security_events AS
SELECT 
  id,
  user_id,
  actie,
  severity,
  details,
  ip_address,
  user_agent,
  created_at,
  CASE 
    WHEN actie IN ('role_change', 'user_promotion', 'privilege_escalation') THEN 'PRIVILEGE_CHANGE'
    WHEN actie IN ('failed_login', 'suspicious_login', 'multiple_failed_attempts') THEN 'AUTH_SECURITY'
    WHEN actie IN ('data_export', 'bulk_delete', 'mass_update') THEN 'DATA_ACCESS'
    WHEN actie IN ('admin_impersonation', 'system_override') THEN 'ADMIN_ACTION'
    ELSE 'GENERAL'
  END as event_category
FROM audit_log
WHERE severity IN ('warning', 'error', 'critical')
ORDER BY created_at DESC;

-- Rate limiting table for authentication
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or IP
  action_type TEXT NOT NULL, -- 'login', 'signup', 'password_reset'
  attempt_count INTEGER DEFAULT 1,
  first_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for security tracking
CREATE TABLE IF NOT EXISTS user_security_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data retention policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  delete_field TEXT DEFAULT 'created_at',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR compliance table for tracking user consents
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'data_processing', 'marketing', 'analytics'
  consented BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  consented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT
);

-- Content moderation table for forum security
CREATE TABLE IF NOT EXISTS content_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'forum_post', 'forum_thread', 'comment'
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  moderation_action TEXT NOT NULL, -- 'flagged', 'approved', 'rejected', 'deleted'
  reason TEXT,
  moderator_id UUID REFERENCES profiles(id),
  automated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password history for security
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON auth_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_action_type ON auth_rate_limits(action_type);
CREATE INDEX IF NOT EXISTS idx_user_security_sessions_user_id ON user_security_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_sessions_active ON user_security_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON content_moderation(content_type, content_id);

-- RLS policies
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for security tables
CREATE POLICY "Admins can manage rate limits" ON auth_rate_limits FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Users can view own sessions" ON user_security_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all sessions" ON user_security_sessions FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can manage retention policies" ON data_retention_policies FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Users can manage own consents" ON user_consents FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all consents" ON user_consents FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins and moderators can manage content moderation" ON content_moderation FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'leerkracht'));
CREATE POLICY "Users can view moderation of their content" ON content_moderation FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view password history" ON password_history FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Security functions
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  current_attempts INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  -- Get current attempts in the window
  SELECT COALESCE(SUM(attempt_count), 0) INTO current_attempts
  FROM auth_rate_limits
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND first_attempt >= window_start
    AND (blocked_until IS NULL OR blocked_until <= NOW());
  
  -- If within limits, allow
  IF current_attempts < p_max_attempts THEN
    -- Insert or update rate limit record
    INSERT INTO auth_rate_limits (identifier, action_type, attempt_count, first_attempt, last_attempt)
    VALUES (p_identifier, p_action_type, 1, NOW(), NOW())
    ON CONFLICT (identifier, action_type) 
    DO UPDATE SET 
      attempt_count = auth_rate_limits.attempt_count + 1,
      last_attempt = NOW();
    
    RETURN TRUE;
  ELSE
    -- Block for additional time
    UPDATE auth_rate_limits 
    SET blocked_until = NOW() + INTERVAL '1 hour'
    WHERE identifier = p_identifier AND action_type = p_action_type;
    
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  UPDATE user_security_sessions 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  -- Log cleanup activity
  INSERT INTO audit_log (user_id, actie, details, severity)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'session_cleanup',
    json_build_object('cleaned_sessions', ROW_COUNT),
    'info'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for GDPR data export
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID) 
RETURNS JSONB AS $$
DECLARE
  user_data JSONB;
BEGIN
  -- Only allow users to export their own data or admins
  IF auth.uid() != p_user_id AND get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized data export attempt';
  END IF;
  
  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.id = p_user_id),
    'forum_posts', (SELECT json_agg(fp) FROM forum_posts fp WHERE fp.author_id = p_user_id),
    'forum_threads', (SELECT json_agg(ft) FROM forum_threads ft WHERE ft.author_id = p_user_id),
    'task_submissions', (SELECT json_agg(ts) FROM task_submissions ts WHERE ts.student_id = p_user_id),
    'enrollments', (SELECT json_agg(i) FROM inschrijvingen i WHERE i.student_id = p_user_id),
    'consents', (SELECT json_agg(uc) FROM user_consents uc WHERE uc.user_id = p_user_id)
  ) INTO user_data;
  
  -- Log the export
  INSERT INTO audit_log (user_id, actie, details, severity)
  VALUES (
    auth.uid(),
    'data_export',
    json_build_object('exported_user', p_user_id, 'timestamp', NOW()),
    'info'
  );
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default data retention policies
INSERT INTO data_retention_policies (table_name, retention_days) VALUES
('audit_log', 365),
('user_sessions', 90),
('auth_rate_limits', 30),
('user_security_sessions', 90)
ON CONFLICT DO NOTHING;