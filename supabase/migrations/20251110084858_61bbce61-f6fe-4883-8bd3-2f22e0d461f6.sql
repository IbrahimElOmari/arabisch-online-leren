-- PR9: Extended Gamification System (SPEELS vs PRESTIGE)
-- Creates 7 tables for gamification engine with full RLS policies

-- 1. Student Game Profiles (main profile with XP, level, streak, game mode)
CREATE TABLE IF NOT EXISTS public.student_game_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('SPEELS', 'PRESTIGE')),
  xp_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_activity_date TIMESTAMPTZ,
  avatar_id TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- 2. Challenges (daily, weekly, special challenges)
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'special')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  completion_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('SPEELS', 'PRESTIGE', 'BOTH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Student Challenges (tracks student progress on challenges)
CREATE TABLE IF NOT EXISTS public.student_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, challenge_id)
);

-- 4. Badges (badge definitions)
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key TEXT NOT NULL UNIQUE,
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  badge_tier TEXT NOT NULL CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  xp_requirement INTEGER NOT NULL DEFAULT 0,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('SPEELS', 'PRESTIGE', 'BOTH')),
  unlock_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Student Badges (earned badges by students)
CREATE TABLE IF NOT EXISTS public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_showcased BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(student_id, badge_id)
);

-- 6. Leaderboard Rankings (calculated rankings)
CREATE TABLE IF NOT EXISTS public.leaderboard_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('class', 'global', 'niveau')),
  scope_id UUID,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  xp_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, leaderboard_type, scope_id, period)
);

-- 7. XP Activities (tracks all XP earning activities)
CREATE TABLE IF NOT EXISTS public.xp_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('task_completed', 'challenge_completed', 'streak_bonus', 'manual_award')),
  xp_earned INTEGER NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_game_profiles_student_id ON public.student_game_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_student_challenges_student_id ON public.student_challenges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_challenges_challenge_id ON public.student_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student_id ON public.student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_composite ON public.leaderboard_rankings(leaderboard_type, scope_id, period, rank);
CREATE INDEX IF NOT EXISTS idx_xp_activities_student_id ON public.xp_activities(student_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.student_game_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_game_profiles
CREATE POLICY "Users can view their own game profile"
  ON public.student_game_profiles FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own game profile"
  ON public.student_game_profiles FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own game profile"
  ON public.student_game_profiles FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all game profiles"
  ON public.student_game_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for challenges
CREATE POLICY "Everyone can view active challenges"
  ON public.challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
  ON public.challenges FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for student_challenges
CREATE POLICY "Users can view their own challenges"
  ON public.student_challenges FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own challenges"
  ON public.student_challenges FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own challenges"
  ON public.student_challenges FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all student challenges"
  ON public.student_challenges FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for badges
CREATE POLICY "Everyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.badges FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for student_badges
CREATE POLICY "Users can view their own badges"
  ON public.student_badges FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can view other students showcased badges"
  ON public.student_badges FOR SELECT
  USING (is_showcased = true);

CREATE POLICY "Users can update their own badge showcase"
  ON public.student_badges FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all student badges"
  ON public.student_badges FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for leaderboard_rankings
CREATE POLICY "Everyone can view leaderboards"
  ON public.leaderboard_rankings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage leaderboards"
  ON public.leaderboard_rankings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for xp_activities
CREATE POLICY "Users can view their own XP activities"
  ON public.xp_activities FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all XP activities"
  ON public.xp_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_gamification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_game_profiles_updated_at
  BEFORE UPDATE ON public.student_game_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_gamification_updated_at();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_gamification_updated_at();

CREATE TRIGGER update_student_challenges_updated_at
  BEFORE UPDATE ON public.student_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_gamification_updated_at();

-- Insert default badges
INSERT INTO public.badges (badge_key, badge_name, badge_description, badge_icon, badge_tier, xp_requirement, game_mode, unlock_criteria)
VALUES
  ('first_steps', 'Eerste Stappen', 'Voltooi je eerste taak', '🎯', 'bronze', 0, 'BOTH', '{"tasks_completed": 1}'::jsonb),
  ('streak_7', 'Weekstarter', '7 dagen achter elkaar actief', '🔥', 'silver', 100, 'SPEELS', '{"streak_days": 7}'::jsonb),
  ('streak_30', 'Streakmeester', '30 dagen achter elkaar actief', '⚡', 'gold', 500, 'BOTH', '{"streak_days": 30}'::jsonb),
  ('xp_master_500', 'XP Master', 'Bereik 500 XP', '⭐', 'silver', 500, 'BOTH', '{"xp_points": 500}'::jsonb),
  ('xp_master_1000', 'XP Legende', 'Bereik 1000 XP', '🏆', 'gold', 1000, 'BOTH', '{"xp_points": 1000}'::jsonb),
  ('level_5', 'Klimmer', 'Bereik level 5', '📈', 'silver', 200, 'SPEELS', '{"level": 5}'::jsonb),
  ('level_10', 'Expert', 'Bereik level 10', '👑', 'platinum', 1000, 'PRESTIGE', '{"level": 10}'::jsonb)
ON CONFLICT (badge_key) DO NOTHING;

-- Insert sample challenges
INSERT INTO public.challenges (challenge_type, title, description, xp_reward, completion_criteria, valid_from, valid_until, is_active, game_mode)
VALUES
  ('daily', 'Dagelijkse Taak', 'Voltooi 1 taak vandaag', 20, '{"tasks_to_complete": 1}'::jsonb, now(), now() + interval '1 day', true, 'BOTH'),
  ('weekly', 'Weekuitdaging', 'Voltooi 5 taken deze week', 100, '{"tasks_to_complete": 5}'::jsonb, now(), now() + interval '7 days', true, 'BOTH'),
  ('special', 'Perfectionist', 'Behaal 100% score op 3 taken', 150, '{"perfect_tasks": 3, "min_score": 100}'::jsonb, now(), now() + interval '30 days', true, 'PRESTIGE')
ON CONFLICT DO NOTHING;

-- Enable realtime for gamification tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_game_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_rankings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_activities;