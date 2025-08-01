-- Create a proper security_events table (not a view)
DROP VIEW IF EXISTS public.security_events;

CREATE TABLE public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  actie text NOT NULL,
  severity text DEFAULT 'info',
  details jsonb,
  ip_address inet,
  user_agent text,
  event_category text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all security events" 
ON public.security_events 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);

-- Add session tracking for admin impersonation
CREATE TABLE IF NOT EXISTS public.admin_impersonation_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage impersonation sessions" 
ON public.admin_impersonation_sessions 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::app_role);