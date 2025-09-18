-- Phase 1: Fix Critical Data Access Security Issues (Final)

-- 1. Remove dangerous public access to klassen table
DROP POLICY IF EXISTS "Everyone can view klassen" ON klassen;
DROP POLICY IF EXISTS "Students can view enrolled klassen" ON klassen;
DROP POLICY IF EXISTS "Teachers can view assigned klassen" ON klassen;

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
DROP POLICY IF EXISTS "Students can view niveaus for enrolled klassen" ON niveaus;
DROP POLICY IF EXISTS "Teachers can view niveaus for assigned klassen" ON niveaus;

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

-- 3. Restore basic profile update policy (role protection will be handled by trigger)
DROP POLICY IF EXISTS "Users cannot change their own role" ON profiles;
DROP POLICY IF EXISTS "Users can update their profile except role" ON profiles;

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Create trigger function to prevent role changes
CREATE OR REPLACE FUNCTION prevent_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only allow role changes if user is admin
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF get_user_role(auth.uid()) != 'admin'::app_role THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
    
    -- Log the role change
    INSERT INTO audit_log (user_id, actie, details, severity)
    VALUES (
      auth.uid(),
      'role_change',
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

-- Apply the trigger
DROP TRIGGER IF EXISTS prevent_role_changes_trigger ON profiles;
CREATE TRIGGER prevent_role_changes_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_changes();