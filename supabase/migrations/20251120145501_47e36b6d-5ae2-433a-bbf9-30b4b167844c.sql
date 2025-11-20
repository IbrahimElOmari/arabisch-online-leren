-- =====================================================
-- Add file_scans table for virus scanning
-- PR13 - Fase 1 Stap 5: Virus Scanning
-- =====================================================

CREATE TABLE IF NOT EXISTS public.file_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'scanning', 'clean', 'infected', 'error')),
  scan_result JSONB,
  scanned_at TIMESTAMPTZ,
  uploaded_by UUID NOT NULL,
  storage_bucket TEXT NOT NULL,
  quarantined BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for file_scans
ALTER TABLE public.file_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own file scans"
ON public.file_scans
FOR SELECT
USING (
  auth.uid() = uploaded_by
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "System can insert file scans"
ON public.file_scans
FOR INSERT
WITH CHECK (public.is_service_role());

CREATE POLICY "System can update file scans"
ON public.file_scans
FOR UPDATE
USING (public.is_service_role());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_file_scans_uploaded_by ON public.file_scans(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_scans_scan_status ON public.file_scans(scan_status);
CREATE INDEX IF NOT EXISTS idx_file_scans_created_at ON public.file_scans(created_at DESC);

-- =====================================================
-- Audit logging for file scans
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_file_scan_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, details, severity)
    VALUES (
      NEW.uploaded_by,
      'FILE_SCAN_INITIATED',
      'file_scan',
      NEW.id::text,
      jsonb_build_object(
        'file_path', NEW.file_path,
        'file_size', NEW.file_size,
        'file_type', NEW.file_type
      ),
      'info'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.scan_status != OLD.scan_status THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, old_values, new_values, severity)
    VALUES (
      NEW.uploaded_by,
      CASE 
        WHEN NEW.scan_status = 'infected' THEN 'FILE_SCAN_THREAT_DETECTED'
        WHEN NEW.scan_status = 'clean' THEN 'FILE_SCAN_COMPLETED'
        ELSE 'FILE_SCAN_STATUS_CHANGED'
      END,
      'file_scan',
      NEW.id::text,
      jsonb_build_object('scan_status', OLD.scan_status),
      jsonb_build_object('scan_status', NEW.scan_status, 'scan_result', NEW.scan_result),
      CASE WHEN NEW.scan_status = 'infected' THEN 'critical' ELSE 'info' END
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER file_scan_audit_trigger
AFTER INSERT OR UPDATE ON public.file_scans
FOR EACH ROW EXECUTE FUNCTION public.audit_file_scan_changes();