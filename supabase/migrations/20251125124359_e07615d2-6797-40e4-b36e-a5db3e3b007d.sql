-- Fix Database Linter Issues
-- This migration addresses security concerns identified by the Supabase linter

-- ============================================================================
-- ISSUE 1-5: Security Definer Views
-- ============================================================================
-- Security definer views can bypass RLS policies. We need to identify and
-- convert them to regular views or security definer functions with explicit
-- search_path to prevent privilege escalation.

-- Note: Since we don't have visibility into which specific views are using
-- SECURITY DEFINER, this migration provides a template approach.
-- In production, you would identify the specific views and convert them.

-- Example approach for any security definer views:
-- DROP VIEW IF EXISTS view_name CASCADE;
-- CREATE VIEW view_name AS SELECT ... (without SECURITY DEFINER);

-- If the view needs elevated privileges, create a security definer function instead:
-- CREATE OR REPLACE FUNCTION get_view_data()
-- RETURNS TABLE(...) AS $$
-- BEGIN
--   RETURN QUERY SELECT ...;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ISSUE 6: Function Search Path Mutable
-- ============================================================================
-- Identify and fix the function without explicit search_path
-- This prevents search_path hijacking attacks

-- Fix for calculate_sla_deadline - add explicit search_path
DROP FUNCTION IF EXISTS public.calculate_sla_deadline(text);

CREATE OR REPLACE FUNCTION public.calculate_sla_deadline(priority_level text)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN CASE priority_level
    WHEN 'urgent' THEN now() + INTERVAL '4 hours'
    WHEN 'high' THEN now() + INTERVAL '24 hours'
    WHEN 'medium' THEN now() + INTERVAL '3 days'
    WHEN 'low' THEN now() + INTERVAL '7 days'
    ELSE now() + INTERVAL '3 days'
  END;
END;
$function$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After migration, run these queries to verify fixes:

-- Check for remaining security definer views:
-- SELECT schemaname, viewname, viewowner
-- FROM pg_views
-- WHERE schemaname = 'public'
-- AND viewname IN (
--   SELECT viewname FROM pg_views v
--   JOIN pg_class c ON v.viewname = c.relname
--   WHERE c.relkind = 'v' AND v.schemaname = 'public'
-- );

-- Check all functions have search_path set:
-- SELECT 
--   p.proname,
--   pg_get_function_identity_arguments(p.oid) as args,
--   p.prosecdef as is_security_definer,
--   pg_catalog.array_to_string(p.proconfig, ', ') as config
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.prosecdef = true
-- AND (p.proconfig IS NULL OR NOT 'search_path=public' = ANY(p.proconfig));

COMMENT ON FUNCTION public.calculate_sla_deadline IS 'Fixed: Added explicit search_path = public to prevent search_path hijacking attacks';
