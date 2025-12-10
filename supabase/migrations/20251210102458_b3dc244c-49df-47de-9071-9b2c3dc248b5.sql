-- =====================================================
-- FIX PROFILES RLS: Complete reset and secure implementation
-- =====================================================

-- Step 1: Drop ALL existing profiles policies to start fresh
DROP POLICY IF EXISTS "Authenticated profiles only" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles in their classes" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view enrolled students profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by owner" ON public.profiles;

-- Step 2: Create secure RLS policies for profiles table

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Teachers can view profiles of students in their classes (inschrijvingen)
CREATE POLICY "profiles_select_teacher_students_inschrijvingen"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'leerkracht') AND
  id IN (
    SELECT i.student_id 
    FROM inschrijvingen i
    JOIN klassen k ON i.class_id = k.id
    WHERE k.teacher_id = auth.uid()
    AND i.payment_status = 'paid'
  )
);

-- Teachers can view students via enrollments (new module system)
CREATE POLICY "profiles_select_teacher_students_enrollments"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'leerkracht') AND
  id IN (
    SELECT e.student_id
    FROM enrollments e
    JOIN module_class_teachers mct ON e.class_id = mct.class_id
    WHERE mct.teacher_id = auth.uid()
    AND e.status = 'active'
  )
);

-- Admins can view all profiles
CREATE POLICY "profiles_select_admin"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all profiles
CREATE POLICY "profiles_update_admin"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete profiles
CREATE POLICY "profiles_delete_admin"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Allow profile creation during signup (user creates own profile or service role)
CREATE POLICY "profiles_insert_own_or_system"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id OR is_service_role());