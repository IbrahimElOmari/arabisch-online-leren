-- Migration: Add SET search_path = public to all SECURITY DEFINER functions
DO $$
DECLARE
  func_record RECORD;
  func_signature TEXT;
  func_args TEXT;
BEGIN
  -- Loop through all SECURITY DEFINER functions in the public schema
  FOR func_record IN 
    SELECT 
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS func_args,
      p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%'
  LOOP
    -- Build the function signature with arguments
    IF func_record.func_args = '' THEN
      func_signature := format('public.%I()', func_record.func_name);
    ELSE
      func_signature := format('public.%I(%s)', func_record.func_name, func_record.func_args);
    END IF;

    -- Add search_path setting to the function
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_signature);
      RAISE NOTICE 'Updated function: %', func_signature;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not update function %: %', func_signature, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Completed search_path migration for SECURITY DEFINER functions';
END $$;

-- Verify the changes
SELECT 
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN 'SECURED ✅'
    ELSE 'NOT SECURED ❌'
  END AS security_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;
