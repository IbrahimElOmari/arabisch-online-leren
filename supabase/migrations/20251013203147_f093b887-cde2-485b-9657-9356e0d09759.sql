-- ============================================
-- PHASE 3-4: RBAC MIGRATION TO user_roles TABLE
-- ============================================
-- This migration implements proper RBAC by moving roles from profiles.role
-- to the dedicated user_roles table, preventing privilege escalation attacks.

-- Step 1: Ensure user_roles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policy: Users can view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Step 2: Migrate existing roles from profiles to user_roles
-- This is idempotent - safe to run multiple times
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  id as user_id, 
  role, 
  created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Update get_user_role() to use user_roles table
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = $1 
  LIMIT 1;
$$;

-- Step 4: Ensure has_role() function exists and uses user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Step 5: Create audit trigger for role changes
CREATE OR REPLACE FUNCTION public.log_role_change_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log insertions (new roles assigned)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, actie, details, severity)
    VALUES (
      auth.uid(),
      'role_assigned',
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'role', NEW.role,
        'timestamp', NOW()
      ),
      'warning'
    );
    RETURN NEW;
  END IF;

  -- Log deletions (roles removed)
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, actie, details, severity)
    VALUES (
      auth.uid(),
      'role_removed',
      jsonb_build_object(
        'target_user_id', OLD.user_id,
        'role', OLD.role,
        'timestamp', NOW()
      ),
      'warning'
    );
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS audit_role_changes ON public.user_roles;
CREATE TRIGGER audit_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change_user_roles();

-- Step 6: Create helper function to get user role name (for backwards compatibility)
CREATE OR REPLACE FUNCTION public.get_user_role_name(user_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = $1 
  LIMIT 1;
$$;

-- Step 7: Update moderationService.changeUserRole to work with user_roles
-- Create function to change user role (replaces direct profile updates)
CREATE OR REPLACE FUNCTION public.change_user_role(
  target_user_id uuid,
  new_role app_role,
  reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  old_role app_role;
  result jsonb;
BEGIN
  -- Only admins can change roles
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change user roles';
  END IF;

  -- Get current role
  SELECT role INTO old_role FROM public.user_roles WHERE user_id = target_user_id LIMIT 1;

  -- Delete old role
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insert new role
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (target_user_id, new_role, auth.uid());

  -- Also update profiles.role for backward compatibility (temporary)
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;

  -- Log to audit
  INSERT INTO public.audit_log (user_id, actie, details, severity)
  VALUES (
    auth.uid(),
    'role_change_executed',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', old_role,
      'new_role', new_role,
      'reason', reason,
      'timestamp', NOW()
    ),
    'critical'
  );

  result := jsonb_build_object(
    'success', true,
    'old_role', old_role,
    'new_role', new_role
  );

  RETURN result;
END;
$$;

-- Verification queries (for manual testing in SQL editor):
-- SELECT COUNT(*) as profile_count FROM profiles WHERE role IS NOT NULL;
-- SELECT COUNT(*) as user_roles_count FROM user_roles;
-- SELECT public.get_user_role(auth.uid());
-- SELECT public.has_role(auth.uid(), 'admin');
-- SELECT * FROM user_roles LIMIT 10;