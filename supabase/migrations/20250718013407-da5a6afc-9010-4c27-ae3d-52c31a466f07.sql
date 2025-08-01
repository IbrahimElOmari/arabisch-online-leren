-- Fix database functions security issues
-- Update get_user_role function with proper security settings
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Update handle_new_user function with proper security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Add audit logging function for role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS log_role_changes ON public.profiles;
CREATE TRIGGER log_role_changes
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.log_role_change();

-- Add RLS policy for audit_log viewing
CREATE POLICY "Admins can view audit_log" ON public.audit_log
FOR SELECT USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Ensure audit_log has proper structure for security events
ALTER TABLE public.audit_log 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';

-- Add index for better audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id_created_at 
ON public.audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_actie_created_at 
ON public.audit_log(actie, created_at DESC);