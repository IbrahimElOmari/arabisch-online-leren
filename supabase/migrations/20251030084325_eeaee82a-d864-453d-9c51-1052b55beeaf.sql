-- ============================================
-- PR2: Admin Module Management & Pricing RLS (FIXED)
-- ============================================

-- First, check and update app_role enum if needed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t 
                 JOIN pg_enum e ON t.oid = e.enumtypid  
                 WHERE t.typname = 'app_role' AND e.enumlabel = 'leerkracht') THEN
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'leerkracht';
  END IF;
END $$;

-- Enable RLS on modules
ALTER TABLE IF EXISTS public.modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "admin_full_access_modules" ON public.modules;
DROP POLICY IF EXISTS "teachers_read_modules" ON public.modules;
DROP POLICY IF EXISTS "students_read_active_modules" ON public.modules;

-- Admins: Full CRUD access
CREATE POLICY "admin_full_access_modules"
ON public.modules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Teachers: Read all modules
CREATE POLICY "teachers_read_modules"
ON public.modules
FOR SELECT
USING (has_role(auth.uid(), 'leerkracht'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Students: Read only active modules
CREATE POLICY "students_read_active_modules"
ON public.modules
FOR SELECT
USING (is_active = true);

-- ============================================
-- MODULE CLASSES RLS
-- ============================================

ALTER TABLE IF EXISTS public.module_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access_classes" ON public.module_classes;
DROP POLICY IF EXISTS "teachers_read_classes" ON public.module_classes;
DROP POLICY IF EXISTS "students_read_active_classes" ON public.module_classes;

-- Admins: Full access
CREATE POLICY "admin_full_access_classes"
ON public.module_classes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Teachers: Read classes
CREATE POLICY "teachers_read_classes"
ON public.module_classes
FOR SELECT
USING (has_role(auth.uid(), 'leerkracht'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Students: Read only active classes
CREATE POLICY "students_read_active_classes"
ON public.module_classes
FOR SELECT
USING (is_active = true);

-- ============================================
-- MODULE LEVELS RLS
-- ============================================

ALTER TABLE IF EXISTS public.module_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access_levels" ON public.module_levels;
DROP POLICY IF EXISTS "teachers_read_levels" ON public.module_levels;
DROP POLICY IF EXISTS "students_read_levels" ON public.module_levels;

-- Admins: Full access
CREATE POLICY "admin_full_access_levels"
ON public.module_levels
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Teachers: Read levels
CREATE POLICY "teachers_read_levels"
ON public.module_levels
FOR SELECT
USING (has_role(auth.uid(), 'leerkracht'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Students: Read all levels
CREATE POLICY "students_read_levels"
ON public.module_levels
FOR SELECT
USING (true);

-- ============================================
-- Audit triggers for module changes
-- ============================================

CREATE OR REPLACE FUNCTION public.audit_module_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      'MODULE_CREATED',
      'module',
      NEW.id,
      jsonb_build_object(
        'name', NEW.name,
        'price_one_time_cents', NEW.price_one_time_cents,
        'installment_months', NEW.installment_months,
        'installment_monthly_cents', NEW.installment_monthly_cents
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      'MODULE_UPDATED',
      'module',
      NEW.id,
      jsonb_build_object(
        'old_name', OLD.name,
        'new_name', NEW.name,
        'old_price', OLD.price_one_time_cents,
        'new_price', NEW.price_one_time_cents,
        'old_active', OLD.is_active,
        'new_active', NEW.is_active
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      'MODULE_DELETED',
      'module',
      OLD.id,
      jsonb_build_object('name', OLD.name)
    );
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS audit_module_changes_trigger ON public.modules;
CREATE TRIGGER audit_module_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.modules
FOR EACH ROW EXECUTE FUNCTION public.audit_module_changes();

CREATE OR REPLACE FUNCTION public.audit_class_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('CLASS_CREATED', 'module_class', NEW.id, jsonb_build_object('class_name', NEW.class_name, 'capacity', NEW.capacity));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event('CLASS_UPDATED', 'module_class', NEW.id, jsonb_build_object('old_name', OLD.class_name, 'new_name', NEW.class_name));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event('CLASS_DELETED', 'module_class', OLD.id, jsonb_build_object('class_name', OLD.class_name));
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS audit_class_changes_trigger ON public.module_classes;
CREATE TRIGGER audit_class_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.module_classes
FOR EACH ROW EXECUTE FUNCTION public.audit_class_changes();

CREATE OR REPLACE FUNCTION public.audit_level_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('LEVEL_CREATED', 'module_level', NEW.id, jsonb_build_object('level_code', NEW.level_code, 'level_name', NEW.level_name));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event('LEVEL_UPDATED', 'module_level', NEW.id, jsonb_build_object('old_code', OLD.level_code, 'new_code', NEW.level_code));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event('LEVEL_DELETED', 'module_level', OLD.id, jsonb_build_object('level_code', OLD.level_code));
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS audit_level_changes_trigger ON public.module_levels;
CREATE TRIGGER audit_level_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.module_levels
FOR EACH ROW EXECUTE FUNCTION public.audit_level_changes();