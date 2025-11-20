-- Fix security warnings: Add SET search_path to functions without it

-- Fix generate_ticket_number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.support_tickets;
  new_number := 'TK-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 5, '0');
  RETURN new_number;
END;
$$;

-- Fix set_ticket_number function  
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix calculate_sla_deadline function
CREATE OR REPLACE FUNCTION calculate_sla_deadline(priority_level TEXT)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN CASE priority_level
    WHEN 'urgent' THEN now() + INTERVAL '4 hours'
    WHEN 'high' THEN now() + INTERVAL '24 hours'
    WHEN 'medium' THEN now() + INTERVAL '3 days'
    WHEN 'low' THEN now() + INTERVAL '7 days'
    ELSE now() + INTERVAL '3 days'
  END;
END;
$$;

-- Fix set_sla_deadline function
CREATE OR REPLACE FUNCTION set_sla_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := calculate_sla_deadline(NEW.priority);
  END IF;
  RETURN NEW;
END;
$$;

-- Fix update_support_updated_at function
CREATE OR REPLACE FUNCTION update_support_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;