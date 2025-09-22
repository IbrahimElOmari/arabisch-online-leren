-- Phase 8: Admin Operations Database Migration

-- Audit logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  meta jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- System settings for maintenance mode and other toggles
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.system_settings(key, value) 
VALUES('maintenance_mode', '{"enabled": false}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage settings"
  ON public.system_settings FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Backup jobs registry
CREATE TABLE IF NOT EXISTS public.backup_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid REFERENCES public.profiles(id),
  status text CHECK (status IN ('queued','running','success','failed')) NOT NULL DEFAULT 'queued',
  note text,
  artifact_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage backups"
  ON public.backup_jobs FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Add status fields to content tables if not present
ALTER TABLE public.lessen 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' 
CHECK (status IN ('draft','published','archived'));

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' 
CHECK (status IN ('draft','published','archived'));

ALTER TABLE public.forum_threads 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' 
CHECK (status IN ('draft','published','archived'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON public.backup_jobs(status, created_at DESC);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_meta jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, meta)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_meta);
END;
$$;