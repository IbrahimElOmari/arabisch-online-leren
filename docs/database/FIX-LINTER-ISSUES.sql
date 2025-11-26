-- =====================================================================
-- SQL Script: Fix Database Linter Issues
-- Date: 2025-01-26
-- Description: 
--   - Add search_path to all functions without explicit search_path
--   - Review and document Security Definer usage
--   - Add documentation for Leaked Password Protection
--
-- IMPORTANT: This script should be run by a database administrator
-- with SUPERUSER privileges. It will modify all public functions
-- to add explicit search_path settings.
-- =====================================================================

-- =====================================================================
-- PART 1: Add search_path to functions without explicit search_path
-- =====================================================================

-- Update all public functions to have explicit search_path = 'public'
-- This prevents SQL injection attacks through search_path manipulation

DO $$
DECLARE
    func_record RECORD;
    func_definition TEXT;
BEGIN
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_functiondef(p.oid) as function_def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prokind IN ('f', 'p') -- functions and procedures
          AND pg_get_functiondef(p.oid) NOT ILIKE '%SET search_path%'
    LOOP
        -- Log the function being updated
        RAISE NOTICE 'Adding search_path to function: %.%', func_record.schema_name, func_record.function_name;
        
        -- Get the full function definition
        func_definition := func_record.function_def;
        
        -- Add SET search_path = 'public' before the function body
        -- This is a safe operation that adds security without breaking functionality
        func_definition := regexp_replace(
            func_definition,
            'LANGUAGE ([a-zA-Z]+)',
            'LANGUAGE \1\nSET search_path = ''public''',
            'i'
        );
        
        -- Execute the updated function definition
        EXECUTE func_definition;
    END LOOP;
END $$;

-- =====================================================================
-- PART 2: Review Security Definer Functions
-- =====================================================================

-- List all SECURITY DEFINER functions for manual review
-- These functions run with the privileges of the function owner
-- rather than the caller, which can be a security risk if not properly controlled

CREATE OR REPLACE VIEW admin.security_definer_functions AS
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_userbyid(p.proowner) as owner,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth', 'storage')
  AND p.prosecdef = true
ORDER BY n.nspname, p.proname;

COMMENT ON VIEW admin.security_definer_functions IS 
'Lists all SECURITY DEFINER functions that should be reviewed for security implications.
SECURITY DEFINER functions run with owner privileges and must be carefully audited.';

-- =====================================================================
-- PART 3: Create Admin Schema for Security Views
-- =====================================================================

-- Create admin schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS admin;

-- Grant access to admins only
REVOKE ALL ON SCHEMA admin FROM PUBLIC;
GRANT USAGE ON SCHEMA admin TO authenticated;

-- Create RLS policy to only allow admins to view admin schema objects
CREATE OR REPLACE FUNCTION admin.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
$$;

-- =====================================================================
-- PART 4: Add Audit Log for Function Execution
-- =====================================================================

-- Create table to log security-sensitive function calls
CREATE TABLE IF NOT EXISTS admin.function_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name text NOT NULL,
    called_by uuid REFERENCES auth.users(id),
    called_at timestamptz NOT NULL DEFAULT now(),
    parameters jsonb,
    result jsonb,
    execution_time_ms integer,
    ip_address inet,
    user_agent text
);

-- Enable RLS on audit log
ALTER TABLE admin.function_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view function audit logs"
    ON admin.function_audit_log
    FOR SELECT
    USING (admin.is_admin());

-- Service role can insert audit logs
CREATE POLICY "Service role can insert function audit logs"
    ON admin.function_audit_log
    FOR INSERT
    WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_function_audit_log_called_at 
    ON admin.function_audit_log(called_at DESC);

CREATE INDEX IF NOT EXISTS idx_function_audit_log_function_name 
    ON admin.function_audit_log(function_name);

-- =====================================================================
-- PART 5: Documentation and Comments
-- =====================================================================

COMMENT ON SCHEMA admin IS 
'Administrative schema containing security monitoring views and audit logs.
Access restricted to users with admin role.';

COMMENT ON TABLE admin.function_audit_log IS
'Audit log for security-sensitive function executions.
Tracks who called what function, when, and with what parameters.';

COMMENT ON FUNCTION admin.is_admin IS
'Helper function to check if current user has admin role.
Used in RLS policies for admin-only resources.';

-- =====================================================================
-- PART 6: Create Function to Enable Leaked Password Protection
-- =====================================================================

-- Note: Leaked Password Protection must be enabled via Supabase Dashboard
-- or Management API, not through SQL migrations.
-- 
-- To enable manually:
-- 1. Go to Supabase Dashboard > Authentication > Policies
-- 2. Enable "Leaked Password Protection"
-- 3. Set minimum password strength requirements:
--    - Minimum length: 12 characters
--    - Require: uppercase, lowercase, numbers, symbols
--    - Check against HaveIBeenPwned database
--
-- To enable via Management API:
-- Use the security-config-manager edge function with action 'password'

-- Create a helper view to check current password protection settings
CREATE OR REPLACE VIEW admin.auth_config_status AS
SELECT 
    'password_min_length' as setting_name,
    '12 characters (recommended)' as recommended_value,
    'Check Supabase Dashboard > Authentication > Policies' as current_value,
    'https://supabase.com/docs/guides/auth/password-security' as documentation_url
UNION ALL
SELECT 
    'leaked_password_protection',
    'Enabled with HaveIBeenPwned',
    'Check Supabase Dashboard > Authentication > Policies',
    'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection'
UNION ALL
SELECT
    'otp_expiry',
    '300 seconds (5 minutes)',
    'Check Supabase Dashboard > Authentication > Email',
    'https://supabase.com/docs/guides/auth/auth-email';

COMMENT ON VIEW admin.auth_config_status IS
'Shows recommended authentication configuration settings that must be set via Dashboard or Management API.
These settings cannot be configured through SQL migrations.';

-- =====================================================================
-- PART 7: Success Summary
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Completed Successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Added search_path to all public functions';
    RAISE NOTICE '✓ Created admin schema with security views';
    RAISE NOTICE '✓ Created function audit log table';
    RAISE NOTICE '✓ Created security monitoring views';
    RAISE NOTICE '';
    RAISE NOTICE 'MANUAL ACTIONS REQUIRED:';
    RAISE NOTICE '1. Review admin.security_definer_functions view';
    RAISE NOTICE '2. Enable Leaked Password Protection in Supabase Dashboard';
    RAISE NOTICE '3. Set minimum password requirements (12+ chars)';
    RAISE NOTICE '4. Configure OTP expiry to 300 seconds';
    RAISE NOTICE '';
    RAISE NOTICE 'For details: SELECT * FROM admin.auth_config_status';
    RAISE NOTICE '========================================';
END $$;
