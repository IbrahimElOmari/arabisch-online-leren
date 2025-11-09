-- PR8: Real-time Monitoring & Notifications (Fixed)
-- Tables: notifications, system_health_checks, metric_thresholds

-- ============================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('metric_alert', 'system_health', 'security_event', 'admin_action')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS: Admin users only
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can view all notifications'
  ) THEN
    CREATE POLICY "Admins can view all notifications"
      ON public.notifications FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can insert notifications'
  ) THEN
    CREATE POLICY "Admins can insert notifications"
      ON public.notifications FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can update their own notifications'
  ) THEN
    CREATE POLICY "Admins can update their own notifications"
      ON public.notifications FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 2. SYSTEM HEALTH CHECKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_type TEXT NOT NULL CHECK (check_type IN ('api_health', 'db_health', 'edge_health', 'storage_health')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON public.system_health_checks(check_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_type ON public.system_health_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON public.system_health_checks(status);

-- RLS: Admin read-only
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_health_checks' AND policyname = 'Admins can view health checks'
  ) THEN
    CREATE POLICY "Admins can view health checks"
      ON public.system_health_checks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================
-- 3. METRIC THRESHOLDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.metric_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('api_latency', 'error_rate', 'db_connections', 'cpu_load', 'memory_usage')),
  warning_threshold NUMERIC NOT NULL,
  critical_threshold NUMERIC NOT NULL,
  evaluation_window_minutes INTEGER NOT NULL DEFAULT 5,
  notification_enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_metric_type UNIQUE(metric_type)
);

CREATE INDEX IF NOT EXISTS idx_metric_thresholds_type ON public.metric_thresholds(metric_type);

-- RLS: Admin full access
ALTER TABLE public.metric_thresholds ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'metric_thresholds' AND policyname = 'Admins can view thresholds'
  ) THEN
    CREATE POLICY "Admins can view thresholds"
      ON public.metric_thresholds FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'metric_thresholds' AND policyname = 'Admins can insert thresholds'
  ) THEN
    CREATE POLICY "Admins can insert thresholds"
      ON public.metric_thresholds FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'metric_thresholds' AND policyname = 'Admins can update thresholds'
  ) THEN
    CREATE POLICY "Admins can update thresholds"
      ON public.metric_thresholds FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'metric_thresholds' AND policyname = 'Admins can delete thresholds'
  ) THEN
    CREATE POLICY "Admins can delete thresholds"
      ON public.metric_thresholds FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at for metric_thresholds
CREATE OR REPLACE FUNCTION public.update_metric_threshold_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_metric_threshold_timestamp ON public.metric_thresholds;
CREATE TRIGGER trigger_update_metric_threshold_timestamp
  BEFORE UPDATE ON public.metric_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_metric_threshold_timestamp();

-- Function to check thresholds and create notifications
CREATE OR REPLACE FUNCTION public.check_metric_threshold(
  p_metric_type TEXT,
  p_metric_value NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_threshold RECORD;
  v_severity TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get threshold for this metric type
  SELECT * INTO v_threshold
  FROM public.metric_thresholds
  WHERE metric_type = p_metric_type
    AND notification_enabled = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Determine severity
  IF p_metric_value >= v_threshold.critical_threshold THEN
    v_severity := 'critical';
    v_title := 'Critical: ' || p_metric_type || ' threshold exceeded';
    v_message := format('Metric %s reached %s (critical threshold: %s)', 
                        p_metric_type, p_metric_value, v_threshold.critical_threshold);
  ELSIF p_metric_value >= v_threshold.warning_threshold THEN
    v_severity := 'warning';
    v_title := 'Warning: ' || p_metric_type || ' threshold exceeded';
    v_message := format('Metric %s reached %s (warning threshold: %s)',
                        p_metric_type, p_metric_value, v_threshold.warning_threshold);
  ELSE
    RETURN;
  END IF;

  -- Create notification for all admins
  INSERT INTO public.notifications (user_id, type, severity, title, message, metadata)
  SELECT 
    ur.user_id,
    'metric_alert',
    v_severity,
    v_title,
    v_message,
    jsonb_build_object(
      'metric_type', p_metric_type,
      'metric_value', p_metric_value,
      'threshold_warning', v_threshold.warning_threshold,
      'threshold_critical', v_threshold.critical_threshold
    )
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 5. INSERT DEFAULT THRESHOLDS
-- ============================================================
INSERT INTO public.metric_thresholds (metric_type, warning_threshold, critical_threshold, evaluation_window_minutes)
VALUES 
  ('api_latency', 500, 1000, 5),
  ('error_rate', 5, 10, 5),
  ('db_connections', 80, 95, 5),
  ('cpu_load', 70, 90, 5),
  ('memory_usage', 80, 95, 5)
ON CONFLICT (metric_type) DO NOTHING;