-- Phase 1: Fix Critical Data Access Security Issues

-- 1. Remove dangerous public access to klassen table
DROP POLICY IF EXISTS "Everyone can view klassen" ON klassen;

-- Create role-specific policies for klassen
CREATE POLICY "Students can view enrolled klassen" 
ON klassen FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT class_id FROM inschrijvingen 
    WHERE student_id = auth.uid() AND payment_status = 'paid'
  )
);

CREATE POLICY "Teachers can view assigned klassen" 
ON klassen FOR SELECT 
TO authenticated
USING (teacher_id = auth.uid());

-- 2. Remove dangerous public access to niveaus table  
DROP POLICY IF EXISTS "Everyone can view niveaus" ON niveaus;

-- Create role-specific policies for niveaus
CREATE POLICY "Students can view niveaus for enrolled klassen" 
ON niveaus FOR SELECT 
TO authenticated
USING (
  class_id IN (
    SELECT class_id FROM inschrijvingen 
    WHERE student_id = auth.uid() AND payment_status = 'paid'
  )
);

CREATE POLICY "Teachers can view niveaus for assigned klassen" 
ON niveaus FOR SELECT 
TO authenticated
USING (
  class_id IN (
    SELECT id FROM klassen WHERE teacher_id = auth.uid()
  )
);

-- 3. Critical: Prevent users from changing their own roles
CREATE POLICY "Users cannot change their own role" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  -- Allow all fields except role to be updated by user
  (OLD.role = NEW.role) OR 
  -- Only admins can change roles
  (get_user_role(auth.uid()) = 'admin'::app_role)
);

-- Remove the existing broad update policy for profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 4. Fix database functions security - add proper search_path
CREATE OR REPLACE FUNCTION public.get_direct_messages(user_id uuid)
RETURNS TABLE(id uuid, sender_id uuid, receiver_id uuid, content text, read boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.read, dm.created_at, dm.updated_at
  FROM direct_messages dm
  WHERE dm.sender_id = user_id OR dm.receiver_id = user_id
  ORDER BY dm.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_conversation_messages(user1_id uuid, user2_id uuid)
RETURNS TABLE(id uuid, sender_id uuid, receiver_id uuid, content text, read boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.read, dm.created_at, dm.updated_at
  FROM direct_messages dm
  WHERE (dm.sender_id = user1_id AND dm.receiver_id = user2_id) 
     OR (dm.sender_id = user2_id AND dm.receiver_id = user1_id)
  ORDER BY dm.created_at ASC;
$function$;

CREATE OR REPLACE FUNCTION public.send_direct_message(sender_id uuid, receiver_id uuid, message_content text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  INSERT INTO direct_messages (sender_id, receiver_id, content, read)
  VALUES (sender_id, receiver_id, message_content, false)
  RETURNING id;
$function$;

CREATE OR REPLACE FUNCTION public.mark_messages_read(sender_id uuid, receiver_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  UPDATE direct_messages 
  SET read = true 
  WHERE direct_messages.sender_id = mark_messages_read.sender_id 
    AND direct_messages.receiver_id = mark_messages_read.receiver_id 
    AND read = false;
$function$;

-- 5. Enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_action text,
  p_details jsonb DEFAULT NULL,
  p_severity text DEFAULT 'info',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO audit_log (
    user_id, 
    actie, 
    details, 
    severity, 
    ip_address, 
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_details,
    p_severity,
    p_ip_address,
    p_user_agent
  );
  
  -- Alert on critical events
  IF p_severity = 'critical' THEN
    -- Log to security_events table as well
    INSERT INTO security_events (
      user_id,
      actie,
      details,
      severity,
      ip_address,
      user_agent
    ) VALUES (
      p_user_id,
      p_action,
      p_details,
      p_severity,
      p_ip_address,
      p_user_agent
    );
  END IF;
END;
$function$;

-- 6. Create trigger for role change monitoring
CREATE OR REPLACE FUNCTION public.monitor_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Log any role changes
  IF OLD.role != NEW.role THEN
    PERFORM log_security_event(
      auth.uid(),
      'role_change_attempt',
      json_build_object(
        'target_user', NEW.id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid()
      ),
      'critical'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the role change monitoring trigger
DROP TRIGGER IF EXISTS monitor_role_changes_trigger ON profiles;
CREATE TRIGGER monitor_role_changes_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION monitor_role_changes();