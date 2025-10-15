-- ============================================
-- PRODUCTION HARDENING: RLS ENFORCEMENT
-- ============================================
-- This migration enforces RLS on critical tables
-- and adds student self-management capabilities

-- 1. FORCE RLS on klassen and inschrijvingen
ALTER TABLE public.klassen FORCE ROW LEVEL SECURITY;
ALTER TABLE public.inschrijvingen FORCE ROW LEVEL SECURITY;

-- 2. Add student delete policy for self-managed enrollments
CREATE POLICY "Students can delete own inschrijvingen"
ON public.inschrijvingen
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'leerling') 
  AND student_id = auth.uid()
);

-- 3. Revoke direct grants (we rely on RLS)
REVOKE ALL ON public.klassen FROM anon, authenticated;
REVOKE ALL ON public.inschrijvingen FROM anon, authenticated;

-- 4. Grant SELECT to authenticated (RLS will filter)
GRANT SELECT ON public.klassen TO authenticated;
GRANT SELECT ON public.inschrijvingen TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inschrijvingen TO authenticated;

-- Verification query (run after migration)
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('klassen', 'inschrijvingen');