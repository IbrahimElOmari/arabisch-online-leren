-- =====================================================
-- Add Missing Moderation Tables
-- PR13 - Stap 4: Moderation Tables
-- =====================================================

-- =====================================================
-- 1. user_warnings (alleen als het niet bestaat)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  expires_at TIMESTAMPTZ,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON public.user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_issued_by ON public.user_warnings(issued_by);
CREATE INDEX IF NOT EXISTS idx_user_warnings_expires_at ON public.user_warnings(expires_at);

-- RLS Policies for user_warnings
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own warnings" ON public.user_warnings;
CREATE POLICY "Users can view own warnings"
ON public.user_warnings
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can acknowledge own warnings" ON public.user_warnings;
CREATE POLICY "Users can acknowledge own warnings"
ON public.user_warnings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage warnings" ON public.user_warnings;
CREATE POLICY "Admins manage warnings"
ON public.user_warnings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 2. ban_history (alleen als het niet bestaat)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ban_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('temporary', 'permanent')),
  banned_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  lifted_by UUID REFERENCES auth.users(id),
  lifted_at TIMESTAMPTZ,
  lift_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ban_history_user_id ON public.ban_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_history_is_active ON public.ban_history(is_active);
CREATE INDEX IF NOT EXISTS idx_ban_history_banned_until ON public.ban_history(banned_until);

-- RLS Policies for ban_history
ALTER TABLE public.ban_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own bans" ON public.ban_history;
CREATE POLICY "Users view own bans"
ON public.ban_history
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins manage bans" ON public.ban_history;
CREATE POLICY "Admins manage bans"
ON public.ban_history
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 3. user_reputation (alleen als het niet bestaat)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_reputation (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reputation_score INTEGER DEFAULT 0,
  helpful_posts INTEGER DEFAULT 0,
  accepted_answers INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  bans_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON public.user_reputation(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_reputation_user_id ON public.user_reputation(user_id);

-- RLS Policies for user_reputation
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view reputation" ON public.user_reputation;
CREATE POLICY "Everyone can view reputation"
ON public.user_reputation
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "System can manage reputation" ON public.user_reputation;
CREATE POLICY "System can manage reputation"
ON public.user_reputation
FOR ALL
USING (
  public.is_service_role()
  OR public.has_role(auth.uid(), 'admin')
);