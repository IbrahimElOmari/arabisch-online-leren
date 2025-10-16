-- FASE 0: RLS Recursie-fix met SECURITY DEFINER helpers
-- =====================================================

-- Helper functions die RLS bypassen binnen hun eigen scope
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(_user uuid, _class uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.klassen k
    WHERE k.id = _class
      AND k.teacher_id = _user
  );
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled_in_class(_user uuid, _class uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.inschrijvingen i
    WHERE i.class_id = _class
      AND i.student_id = _user
      AND i.payment_status = 'paid'
  );
$$;

-- Drop oude policies met recursie-problemen
DROP POLICY IF EXISTS "Admins can manage klassen" ON public.klassen;
DROP POLICY IF EXISTS "Teachers can view assigned klassen" ON public.klassen;
DROP POLICY IF EXISTS "Enrolled students can view their klassen" ON public.klassen;

DROP POLICY IF EXISTS "Admins can manage all inschrijvingen" ON public.inschrijvingen;
DROP POLICY IF EXISTS "Teachers can view inschrijvingen for their klassen" ON public.inschrijvingen;
DROP POLICY IF EXISTS "Students can view own inschrijvingen" ON public.inschrijvingen;
DROP POLICY IF EXISTS "Students can delete own inschrijvingen" ON public.inschrijvingen;

-- Nieuwe policies zonder circulaire RLS-verwijzingen
-- KLASSEN
CREATE POLICY "Admins can manage klassen"
ON public.klassen
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers see own klassen"
ON public.klassen
FOR SELECT
TO authenticated
USING (is_teacher_of_class(auth.uid(), id));

CREATE POLICY "Students see enrolled klassen"
ON public.klassen
FOR SELECT
TO authenticated
USING (is_enrolled_in_class(auth.uid(), id));

-- INSCHRIJVINGEN
CREATE POLICY "Admins manage inschrijvingen"
ON public.inschrijvingen
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers see inschrijvingen of own klassen"
ON public.inschrijvingen
FOR SELECT
TO authenticated
USING (is_teacher_of_class(auth.uid(), class_id));

CREATE POLICY "Students see own inschrijvingen"
ON public.inschrijvingen
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students create own inschrijving"
ON public.inschrijvingen
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students delete own inschrijving"
ON public.inschrijvingen
FOR DELETE
TO authenticated
USING (student_id = auth.uid());