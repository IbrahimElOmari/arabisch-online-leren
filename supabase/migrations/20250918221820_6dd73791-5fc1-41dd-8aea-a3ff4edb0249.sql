-- Phase 1: Fix Critical Data Access Security Issues (Corrected)

-- 1. Remove dangerous public access to klassen table and existing policies
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

-- 2. Remove dangerous public access to niveaus table and existing policies
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

-- 3. Critical: Prevent users from changing their own roles
DROP POLICY IF EXISTS "Users cannot change their own role" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create separate policies for profile updates
CREATE POLICY "Users can update their profile except role" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  (OLD.role = NEW.role OR get_user_role(auth.uid()) = 'admin'::app_role)
);