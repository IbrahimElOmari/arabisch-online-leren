-- ==========================================
-- STAP F: COMPLETE DATABASE SCHEMA
-- Module System, Content Management, Learning Analytics,
-- Gamification, Certificates, Admin Tools
-- ==========================================

-- ============ MODULE SYSTEM (F11) ============

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  price_one_time_cents INTEGER NOT NULL DEFAULT 0,
  installment_months INTEGER DEFAULT 0,
  installment_monthly_cents INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.module_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  class_name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 30,
  current_enrollment INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.module_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  level_code TEXT NOT NULL,
  level_name TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, level_code)
);

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  date_of_birth DATE,
  is_minor BOOLEAN DEFAULT FALSE,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  emergency_contact TEXT,
  consent_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  module_id UUID REFERENCES modules(id) NOT NULL,
  class_id UUID REFERENCES module_classes(id),
  level_id UUID REFERENCES module_levels(id),
  payment_type TEXT CHECK (payment_type IN ('one_time', 'installment')),
  status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'pending_placement', 'active', 'suspended', 'completed', 'cancelled')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  UNIQUE(student_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) NOT NULL,
  amount_cents INTEGER NOT NULL,
  payment_type TEXT NOT NULL,
  payment_method TEXT DEFAULT 'stub',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed', 'refunded')),
  transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.placement_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) NOT NULL,
  test_name TEXT NOT NULL,
  questions JSONB NOT NULL,
  level_ranges JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.placement_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  placement_test_id UUID REFERENCES placement_tests(id) NOT NULL,
  score INTEGER NOT NULL,
  assigned_level_id UUID REFERENCES module_levels(id),
  answers JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) NOT NULL,
  module_class_id UUID REFERENCES module_classes(id) NOT NULL,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE
);

-- ============ CONTENT MANAGEMENT (F1) ============

CREATE TABLE IF NOT EXISTS public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'question', 'task', 'forum_post')),
  content_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  content_data JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT,
  is_published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[],
  alt_text TEXT,
  usage_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('lesson', 'question', 'assignment', 'forum_thread')),
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- ============ INTERACTIVE LEARNING (F2) ============

ALTER TABLE vragen 
  ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice',
  ADD COLUMN IF NOT EXISTS interaction_config JSONB,
  ADD COLUMN IF NOT EXISTS hints JSONB[],
  ADD COLUMN IF NOT EXISTS explanation JSONB;

CREATE TABLE IF NOT EXISTS public.learning_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  niveau_id UUID REFERENCES niveaus(id),
  module_id UUID REFERENCES modules(id),
  topic TEXT NOT NULL,
  accuracy_rate DECIMAL(5,2),
  avg_time_per_question INTERVAL,
  weak_areas TEXT[],
  strong_areas TEXT[],
  recommended_exercises UUID[],
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  session_type TEXT CHECK (session_type IN ('solo', 'peer', 'group')),
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  session_data JSONB
);

CREATE TABLE IF NOT EXISTS public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  niveau_id UUID REFERENCES niveaus(id),
  module_id UUID REFERENCES modules(id),
  max_participants INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  room_config JSONB
);

CREATE TABLE IF NOT EXISTS public.study_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

-- ============ TEACHER ANALYTICS (F3) ============

CREATE TABLE IF NOT EXISTS public.teacher_analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) NOT NULL,
  class_id UUID REFERENCES klassen(id),
  metric_type TEXT NOT NULL,
  metric_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.grading_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_name TEXT NOT NULL,
  rubric_type TEXT CHECK (rubric_type IN ('assignment', 'participation', 'project')),
  criteria JSONB NOT NULL,
  total_points INTEGER NOT NULL,
  created_by UUID REFERENCES profiles(id),
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_category TEXT CHECK (template_category IN ('announcement', 'feedback', 'reminder')),
  template_content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  is_shared BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  recipient_type TEXT CHECK (recipient_type IN ('class', 'student', 'parents')),
  recipient_ids UUID[],
  message_content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed'))
);

-- ============ GAMIFICATION (F4) ============

CREATE TABLE IF NOT EXISTS public.student_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  niveau_id UUID REFERENCES niveaus(id),
  module_id UUID REFERENCES modules(id),
  topic_name TEXT NOT NULL,
  completion_percentage DECIMAL(5,2),
  mastery_level TEXT CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  exercises_completed INTEGER DEFAULT 0,
  exercises_total INTEGER NOT NULL,
  last_practiced TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id TEXT UNIQUE NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achievement_icon TEXT,
  achievement_category TEXT,
  achievement_tier TEXT CHECK (achievement_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  unlock_criteria JSONB NOT NULL,
  points_value INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  achievement_id TEXT REFERENCES achievement_definitions(achievement_id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress_data JSONB,
  is_showcased BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('class', 'global', 'topic')),
  scope_id UUID,
  time_period TEXT CHECK (time_period IN ('daily', 'weekly', 'monthly', 'all_time')),
  score INTEGER NOT NULL,
  rank INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_wallet (
  student_id UUID PRIMARY KEY REFERENCES profiles(id),
  total_xp BIGINT DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  virtual_coins INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  last_xp_update TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reward_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  item_type TEXT CHECK (item_type IN ('theme', 'avatar', 'badge_frame', 'profile_background')),
  item_description TEXT,
  item_data JSONB,
  cost_coins INTEGER NOT NULL,
  cost_xp INTEGER DEFAULT 0,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.student_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  item_id UUID REFERENCES reward_items(id) NOT NULL,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  is_equipped BOOLEAN DEFAULT FALSE,
  UNIQUE(student_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.student_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) NOT NULL,
  following_id UUID REFERENCES profiles(id) NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB NOT NULL,
  visibility TEXT DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CERTIFICATES (F5) ============

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_design JSONB NOT NULL,
  template_language TEXT DEFAULT 'nl',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.completion_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau_id UUID REFERENCES niveaus(id),
  module_id UUID REFERENCES modules(id),
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('assessment', 'participation', 'time', 'custom')),
  criteria_config JSONB NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,
  is_required BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.issued_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id TEXT UNIQUE NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  niveau_id UUID REFERENCES niveaus(id),
  module_id UUID REFERENCES modules(id),
  template_id UUID REFERENCES certificate_templates(id),
  certificate_data JSONB NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  issued_by UUID REFERENCES profiles(id),
  pdf_url TEXT,
  verification_url TEXT,
  qr_code_url TEXT,
  signature_hash TEXT NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.certificate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verifier_ip INET,
  verification_method TEXT CHECK (verification_method IN ('qr', 'id_lookup', 'url'))
);

-- ============ ADMIN TOOLS (F7) ============

CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  flag_description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_roles TEXT[],
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id UUID REFERENCES profiles(id),
  reported_by UUID REFERENCES profiles(id),
  report_type TEXT NOT NULL,
  report_reason TEXT NOT NULL,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_title TEXT NOT NULL,
  announcement_content TEXT NOT NULL,
  announcement_type TEXT CHECK (announcement_type IN ('info', 'warning', 'maintenance')),
  target_roles TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  display_from TIMESTAMPTZ DEFAULT NOW(),
  display_until TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ LESSONS & FORUM ACCESS ============

CREATE TABLE IF NOT EXISTS public.prep_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) NOT NULL,
  level_id UUID REFERENCES module_levels(id) NOT NULL,
  lesson_title TEXT NOT NULL,
  lesson_content JSONB NOT NULL,
  lesson_order INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) NOT NULL,
  class_id UUID REFERENCES module_classes(id) NOT NULL,
  level_id UUID REFERENCES module_levels(id) NOT NULL,
  lesson_title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  join_url TEXT,
  recording_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) NOT NULL,
  level_id UUID REFERENCES module_levels(id),
  class_id UUID REFERENCES module_classes(id),
  room_name TEXT NOT NULL,
  room_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_room_id UUID REFERENCES forum_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(forum_room_id, user_id)
);

-- ============ TEACHER REWARDS ============

CREATE TABLE IF NOT EXISTS public.teacher_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  reward_type TEXT CHECK (reward_type IN ('points', 'badge', 'coins')),
  reward_value INTEGER NOT NULL,
  reason TEXT,
  awarded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES FOR PERFORMANCE ============

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_module ON enrollments(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_placement_results_student ON placement_results(student_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_content ON content_versions(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_student ON learning_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_student ON practice_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_student ON leaderboard_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_student ON activity_feed(student_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_student ON issued_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_forum_members_user ON forum_members(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_rewards_student ON teacher_rewards(student_id);

-- ============ RLS POLICIES ============

-- Modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage modules" ON public.modules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone views active modules" ON public.modules
  FOR SELECT USING (is_active = true);

-- Module Classes
ALTER TABLE public.module_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage module classes" ON public.module_classes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone views active classes" ON public.module_classes
  FOR SELECT USING (is_active = true);

-- Module Levels
ALTER TABLE public.module_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage module levels" ON public.module_levels
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone views module levels" ON public.module_levels
  FOR SELECT USING (true);

-- Student Profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own profile" ON public.student_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students create own profile" ON public.student_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students update own profile" ON public.student_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins manage all student profiles" ON public.student_profiles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own enrollments" ON public.enrollments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students create own enrollments" ON public.enrollments
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins manage all enrollments" ON public.enrollments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers view class enrollments" ON public.enrollments
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM klassen WHERE teacher_id = auth.uid()
    )
  );

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own payments" ON public.payments
  FOR SELECT USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "System creates payments" ON public.payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins manage all payments" ON public.payments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Placement Tests
ALTER TABLE public.placement_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage placement tests" ON public.placement_tests
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Students view active placement tests" ON public.placement_tests
  FOR SELECT USING (is_active = true);

-- Content Management Tables (F1)
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage content versions" ON public.content_versions
  FOR ALL USING (has_role(auth.uid(), 'leerkracht') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers manage media" ON public.media_library
  FOR ALL USING (has_role(auth.uid(), 'leerkracht') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers manage templates" ON public.content_templates
  FOR ALL USING (has_role(auth.uid(), 'leerkracht') OR has_role(auth.uid(), 'admin'));

-- Learning Analytics (F2)
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own analytics" ON public.learning_analytics
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "System updates analytics" ON public.learning_analytics
  FOR ALL USING (true);

CREATE POLICY "Students manage own practice" ON public.practice_sessions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Students manage study rooms" ON public.study_rooms
  FOR ALL USING (created_by = auth.uid() OR true);

-- Teacher Tools (F3)
ALTER TABLE public.teacher_analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers view own analytics" ON public.teacher_analytics_cache
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers manage rubrics" ON public.grading_rubrics
  FOR ALL USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers manage templates" ON public.message_templates
  FOR ALL USING (created_by = auth.uid() OR is_shared = true);

-- Gamification (F4)
ALTER TABLE public.student_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own progress" ON public.student_topic_progress
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Everyone views achievements" ON public.achievement_definitions
  FOR SELECT USING (true);

CREATE POLICY "Students view own achievements" ON public.student_achievements
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students view leaderboards" ON public.leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "Students manage own wallet" ON public.student_wallet
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Students view reward store" ON public.reward_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Students manage own inventory" ON public.student_inventory
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Students manage own feed" ON public.activity_feed
  FOR ALL USING (student_id = auth.uid());

-- Certificates (F5)
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage certificate templates" ON public.certificate_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Students view own certificates" ON public.issued_certificates
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Public verify certificates" ON public.certificate_verifications
  FOR INSERT WITH CHECK (true);

-- Admin Tools (F7)
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view system metrics" ON public.system_metrics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage feature flags" ON public.feature_flags
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create reports" ON public.user_reports
  FOR INSERT WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Admins manage reports" ON public.user_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone views active announcements" ON public.system_announcements
  FOR SELECT USING (is_active = true AND display_from <= NOW() AND (display_until IS NULL OR display_until >= NOW()));

-- Lessons & Forum
ALTER TABLE public.prep_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage prep lessons" ON public.prep_lessons
  FOR ALL USING (has_role(auth.uid(), 'leerkracht') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled students view prep lessons" ON public.prep_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id = auth.uid()
        AND e.module_id = prep_lessons.module_id
        AND e.level_id = prep_lessons.level_id
        AND e.status = 'active'
    )
  );

CREATE POLICY "Teachers manage live lessons" ON public.live_lessons
  FOR ALL USING (has_role(auth.uid(), 'leerkracht') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled students view live lessons" ON public.live_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id = auth.uid()
        AND e.module_id = live_lessons.module_id
        AND e.class_id = live_lessons.class_id
        AND e.status = 'active'
    )
  );

CREATE POLICY "Admins manage forum rooms" ON public.forum_rooms
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Members view forum rooms" ON public.forum_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forum_members fm
      WHERE fm.forum_room_id = forum_rooms.id
        AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members manage own membership" ON public.forum_members
  FOR ALL USING (user_id = auth.uid());

-- Teacher Rewards
ALTER TABLE public.teacher_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers award rewards" ON public.teacher_rewards
  FOR INSERT WITH CHECK (teacher_id = auth.uid() AND has_role(auth.uid(), 'leerkracht'));

CREATE POLICY "Students view own rewards" ON public.teacher_rewards
  FOR SELECT USING (student_id = auth.uid());

-- ============ TRIGGERS ============

CREATE OR REPLACE FUNCTION update_enrollment_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE enrollments
  SET last_activity = NOW()
  WHERE student_id = NEW.student_id
    AND status = 'active';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_activity_on_submission
  AFTER INSERT ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_last_activity();

CREATE TRIGGER update_enrollment_activity_on_answer
  AFTER INSERT ON antwoorden
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_last_activity();