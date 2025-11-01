-- ============================================================================
-- PR3: Student Profiles Table Only
-- ============================================================================

-- Create student_profiles table with parent/guardian info
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  is_minor BOOLEAN NOT NULL DEFAULT false,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  emergency_contact JSONB,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students manage own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.student_profiles;

-- RLS Policies for student_profiles
CREATE POLICY "Students manage own profile"
  ON public.student_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all profiles"
  ON public.student_profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Audit trigger for student_profiles
CREATE OR REPLACE FUNCTION audit_student_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, new_values)
    VALUES (NEW.user_id, 'STUDENT_PROFILE_CREATED', 'student_profile', NEW.id::text, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, old_values, new_values)
    VALUES (NEW.user_id, 'STUDENT_PROFILE_UPDATED', 'student_profile', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_student_profile_trigger ON public.student_profiles;
CREATE TRIGGER audit_student_profile_trigger
  AFTER INSERT OR UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_student_profile_changes();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);