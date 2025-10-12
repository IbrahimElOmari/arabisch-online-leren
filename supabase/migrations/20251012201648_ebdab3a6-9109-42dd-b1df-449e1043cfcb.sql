-- FASE 3: SECURITY HARDENING - Database Function Search Path Fixes
-- Dit voorkomt SQL injection via search_path manipulatie
-- Alle security definer functies krijgen expliciete search_path = public

-- 1. mark_messages_read
CREATE OR REPLACE FUNCTION public.mark_messages_read(sender_id uuid, receiver_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  UPDATE public.direct_messages 
  SET read = true 
  WHERE direct_messages.sender_id = mark_messages_read.sender_id 
    AND direct_messages.receiver_id = mark_messages_read.receiver_id 
    AND read = false;
$function$;

-- 2. search_global
CREATE OR REPLACE FUNCTION public.search_global(p_query text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_class_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(entity_type text, entity_id uuid, title text, body text, class_id uuid, created_at timestamp with time zone, rank real)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ts_query tsquery;
BEGIN
  ts_query := plainto_tsquery('dutch', p_query);
  
  RETURN QUERY
  SELECT 
    gsi.entity_type,
    gsi.entity_id,
    gsi.title,
    gsi.body,
    gsi.class_id,
    gsi.created_at,
    ts_rank(gsi.tsv, ts_query) as rank
  FROM public.global_search_index gsi
  WHERE 
    gsi.tsv @@ ts_query
    AND (p_class_id IS NULL OR gsi.class_id = p_class_id)
  ORDER BY rank DESC, gsi.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 3. check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action_type text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_attempts INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  SELECT COALESCE(SUM(attempt_count), 0) INTO current_attempts
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND first_attempt >= window_start
    AND (blocked_until IS NULL OR blocked_until <= NOW());
  
  IF current_attempts < p_max_attempts THEN
    INSERT INTO public.auth_rate_limits (identifier, action_type, attempt_count, first_attempt, last_attempt)
    VALUES (p_identifier, p_action_type, 1, NOW(), NOW())
    ON CONFLICT (identifier, action_type) 
    DO UPDATE SET 
      attempt_count = public.auth_rate_limits.attempt_count + 1,
      last_attempt = NOW();
    
    RETURN TRUE;
  ELSE
    UPDATE public.auth_rate_limits 
    SET blocked_until = NOW() + INTERVAL '1 hour'
    WHERE identifier = p_identifier AND action_type = p_action_type;
    
    RETURN FALSE;
  END IF;
END;
$function$;

-- 4. get_direct_messages
CREATE OR REPLACE FUNCTION public.get_direct_messages(user_id uuid)
RETURNS TABLE(id uuid, sender_id uuid, receiver_id uuid, content text, read boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.read, dm.created_at, dm.updated_at
  FROM public.direct_messages dm
  WHERE dm.sender_id = user_id OR dm.receiver_id = user_id
  ORDER BY dm.created_at DESC;
$function$;

-- 5. get_conversation_messages
CREATE OR REPLACE FUNCTION public.get_conversation_messages(user1_id uuid, user2_id uuid)
RETURNS TABLE(id uuid, sender_id uuid, receiver_id uuid, content text, read boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.read, dm.created_at, dm.updated_at
  FROM public.direct_messages dm
  WHERE (dm.sender_id = user1_id AND dm.receiver_id = user2_id) 
     OR (dm.sender_id = user2_id AND dm.receiver_id = user1_id)
  ORDER BY dm.created_at ASC;
$function$;

-- 6. update_student_progress_enhanced
CREATE OR REPLACE FUNCTION public.update_student_progress_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  progress_record RECORD;
  task_points INTEGER := 0;
  question_points INTEGER := 0;
  total_niveau_points INTEGER;
  thresholds INTEGER[] := ARRAY[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  threshold INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'task_submissions' THEN
    task_points := COALESCE(NEW.grade, 0);
  ELSIF TG_TABLE_NAME = 'antwoorden' THEN
    question_points := COALESCE(NEW.punten, 0);
  END IF;

  IF TG_TABLE_NAME = 'task_submissions' THEN
    SELECT t.level_id INTO progress_record.niveau_id
    FROM public.tasks t 
    WHERE t.id = NEW.task_id;
  ELSIF TG_TABLE_NAME = 'antwoorden' THEN
    SELECT v.niveau_id INTO progress_record.niveau_id
    FROM public.vragen v 
    WHERE v.id = NEW.vraag_id;
  END IF;

  INSERT INTO public.student_niveau_progress (
    student_id, 
    niveau_id, 
    total_points,
    completed_tasks,
    completed_questions
  ) VALUES (
    NEW.student_id,
    progress_record.niveau_id,
    task_points + question_points,
    CASE WHEN TG_TABLE_NAME = 'task_submissions' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'antwoorden' THEN 1 ELSE 0 END
  )
  ON CONFLICT (student_id, niveau_id) 
  DO UPDATE SET
    total_points = public.student_niveau_progress.total_points + (task_points + question_points),
    completed_tasks = public.student_niveau_progress.completed_tasks + 
      CASE WHEN TG_TABLE_NAME = 'task_submissions' THEN 1 ELSE 0 END,
    completed_questions = public.student_niveau_progress.completed_questions + 
      CASE WHEN TG_TABLE_NAME = 'antwoorden' THEN 1 ELSE 0 END,
    updated_at = now();

  SELECT 
    COALESCE(snp.total_points, 0) + COALESCE(bp.bonus_total, 0)
  INTO total_niveau_points
  FROM public.student_niveau_progress snp
  LEFT JOIN (
    SELECT student_id, niveau_id, SUM(points) as bonus_total
    FROM public.bonus_points 
    WHERE student_id = NEW.student_id AND niveau_id = progress_record.niveau_id
    GROUP BY student_id, niveau_id
  ) bp ON snp.student_id = bp.student_id AND snp.niveau_id = bp.niveau_id
  WHERE snp.student_id = NEW.student_id AND snp.niveau_id = progress_record.niveau_id;

  FOREACH threshold IN ARRAY thresholds LOOP
    IF total_niveau_points >= threshold THEN
      INSERT INTO public.awarded_badges (
        student_id,
        niveau_id,
        badge_type,
        badge_id,
        badge_name,
        badge_description,
        points_threshold
      ) VALUES (
        NEW.student_id,
        progress_record.niveau_id,
        'automatic',
        'points_' || threshold,
        threshold || ' Punten Badge',
        'Behaald door ' || threshold || ' punten te verdienen',
        threshold
      )
      ON CONFLICT (student_id, niveau_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  UPDATE public.student_niveau_progress 
  SET is_completed = TRUE, completed_at = now()
  WHERE student_id = NEW.student_id 
    AND niveau_id = progress_record.niveau_id 
    AND total_niveau_points >= 1000 
    AND is_completed = FALSE;

  RETURN NEW;
END;
$function$;

-- 7. get_total_niveau_points
CREATE OR REPLACE FUNCTION public.get_total_niveau_points(p_student_id uuid, p_niveau_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(snp.total_points, 0) + COALESCE(bp.bonus_total, 0)
  FROM public.student_niveau_progress snp
  LEFT JOIN (
    SELECT student_id, niveau_id, SUM(points) as bonus_total
    FROM public.bonus_points 
    WHERE student_id = p_student_id AND niveau_id = p_niveau_id
    GROUP BY student_id, niveau_id
  ) bp ON snp.student_id = bp.student_id AND snp.niveau_id = bp.niveau_id
  WHERE snp.student_id = p_student_id AND snp.niveau_id = p_niveau_id;
$function$;

-- 8. update_student_progress
CREATE OR REPLACE FUNCTION public.update_student_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  progress_record RECORD;
  task_points INTEGER := 0;
  question_points INTEGER := 0;
BEGIN
  IF TG_TABLE_NAME = 'task_submissions' THEN
    task_points := COALESCE(NEW.grade, 0);
  ELSIF TG_TABLE_NAME = 'antwoorden' THEN
    question_points := COALESCE(NEW.punten, 0);
  END IF;

  IF TG_TABLE_NAME = 'task_submissions' THEN
    SELECT t.level_id INTO progress_record.niveau_id
    FROM public.tasks t 
    WHERE t.id = NEW.task_id;
  ELSIF TG_TABLE_NAME = 'antwoorden' THEN
    SELECT v.niveau_id INTO progress_record.niveau_id
    FROM public.vragen v 
    WHERE v.id = NEW.vraag_id;
  END IF;

  INSERT INTO public.student_niveau_progress (
    student_id, 
    niveau_id, 
    total_points,
    completed_tasks,
    completed_questions
  ) VALUES (
    NEW.student_id,
    progress_record.niveau_id,
    task_points + question_points,
    CASE WHEN TG_TABLE_NAME = 'task_submissions' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'antwoorden' THEN 1 ELSE 0 END
  )
  ON CONFLICT (student_id, niveau_id) 
  DO UPDATE SET
    total_points = public.student_niveau_progress.total_points + (task_points + question_points),
    completed_tasks = public.student_niveau_progress.completed_tasks + 
      CASE WHEN TG_TABLE_NAME = 'task_submissions' THEN 1 ELSE 0 END,
    completed_questions = public.student_niveau_progress.completed_questions + 
      CASE WHEN TG_TABLE_NAME = 'antwoorden' THEN 1 ELSE 0 END,
    updated_at = now();

  UPDATE public.student_niveau_progress 
  SET is_completed = TRUE, completed_at = now()
  WHERE student_id = NEW.student_id 
    AND niveau_id = progress_record.niveau_id 
    AND total_points >= 1000 
    AND is_completed = FALSE;

  RETURN NEW;
END;
$function$;

-- 9. send_direct_message
CREATE OR REPLACE FUNCTION public.send_direct_message(sender_id uuid, receiver_id uuid, message_content text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  INSERT INTO public.direct_messages (sender_id, receiver_id, content, read)
  VALUES (sender_id, receiver_id, message_content, false)
  RETURNING id;
$function$;

-- 10. create_message_notification
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, type, payload)
  SELECT 
    cp.user_id,
    'message',
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_name', (SELECT full_name FROM profiles WHERE id = NEW.sender_id),
      'content', NEW.content
    )
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id;
    
  RETURN NEW;
END;
$function$;

-- 11. create_grade_notification
CREATE OR REPLACE FUNCTION public.create_grade_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.grade IS NOT NULL AND (OLD.grade IS NULL OR OLD.grade != NEW.grade) THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      NEW.student_id,
      'grade',
      jsonb_build_object(
        'task_id', NEW.task_id,
        'grade', NEW.grade,
        'task_title', (SELECT title FROM tasks WHERE id = NEW.task_id)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 12. get_user_role (ALREADY HAS search_path)
-- No change needed - already correct

-- 13. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 14. log_role_change
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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

-- 15. cleanup_expired_sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_security_sessions 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  INSERT INTO public.audit_log (user_id, actie, details, severity)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'session_cleanup',
    json_build_object('cleaned_sessions', ROW_COUNT),
    'info'
  );
END;
$function$;

-- 16. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 17. log_audit_event
CREATE OR REPLACE FUNCTION public.log_audit_event(p_action text, p_entity_type text, p_entity_id uuid DEFAULT NULL::uuid, p_meta jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, meta)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_meta);
END;
$function$;

-- 18. has_role (ALREADY HAS search_path)
-- No change needed - already correct

-- 19. export_user_data
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_data JSONB;
BEGIN
  IF auth.uid() != p_user_id AND public.get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized data export attempt';
  END IF;
  
  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = p_user_id),
    'forum_posts', (SELECT json_agg(fp) FROM public.forum_posts fp WHERE fp.author_id = p_user_id),
    'forum_threads', (SELECT json_agg(ft) FROM public.forum_threads ft WHERE ft.author_id = p_user_id),
    'task_submissions', (SELECT json_agg(ts) FROM public.task_submissions ts WHERE ts.student_id = p_user_id),
    'enrollments', (SELECT json_agg(i) FROM public.inschrijvingen i WHERE i.student_id = p_user_id),
    'consents', (SELECT json_agg(uc) FROM public.user_consents uc WHERE uc.user_id = p_user_id)
  ) INTO user_data;
  
  INSERT INTO public.audit_log (user_id, actie, details, severity)
  VALUES (
    auth.uid(),
    'data_export',
    json_build_object('exported_user', p_user_id, 'timestamp', NOW()),
    'info'
  );
  
  RETURN user_data;
END;
$function$;

COMMENT ON FUNCTION public.mark_messages_read IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.search_global IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.check_rate_limit IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.get_direct_messages IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.get_conversation_messages IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.update_student_progress_enhanced IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.get_total_niveau_points IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.update_student_progress IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.send_direct_message IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.create_message_notification IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.create_grade_notification IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.handle_new_user IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.log_role_change IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.cleanup_expired_sessions IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.update_updated_at_column IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.log_audit_event IS 'PHASE 3 HARDENED: search_path explicitly set';
COMMENT ON FUNCTION public.export_user_data IS 'PHASE 3 HARDENED: search_path explicitly set';