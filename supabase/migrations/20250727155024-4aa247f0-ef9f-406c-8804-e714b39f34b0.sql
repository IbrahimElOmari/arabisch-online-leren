-- Fix security_events table RLS policies
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security events" 
ON public.security_events 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);

-- Update database functions to include proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, parent_email, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'leerling'::public.app_role),
    NEW.raw_user_meta_data ->> 'parent_email',
    NEW.email
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Log role changes to audit_log table
  INSERT INTO public.audit_log (user_id, actie, details)
  VALUES (
    auth.uid(),
    'role_change',
    json_build_object(
      'target_user_id', NEW.id,
      'old_role', OLD.role,
      'new_role', NEW.role,
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action_type text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;