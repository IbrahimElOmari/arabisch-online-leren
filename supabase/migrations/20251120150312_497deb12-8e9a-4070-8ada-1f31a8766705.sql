-- =====================================================
-- Fix Critical Security Issue: Profiles Table
-- PR13 - Security Hardening
-- =====================================================

-- Remove overly permissive profiles policy
DROP POLICY IF EXISTS "Authenticated profiles only" ON public.profiles;

-- Add teacher access to student profiles
CREATE POLICY "Teachers can view their students profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM klassen k
    INNER JOIN inschrijvingen i ON i.class_id = k.id
    WHERE k.teacher_id = auth.uid()
      AND i.student_id = profiles.id
      AND i.payment_status = 'paid'
  )
);