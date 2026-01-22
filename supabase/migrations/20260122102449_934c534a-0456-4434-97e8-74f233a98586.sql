-- ================================================================
-- PUNT 11: Fix Overly Permissive RLS Policies
-- ================================================================

-- Fix learning_analytics: Remove dangerous USING(true)
DROP POLICY IF EXISTS "System updates analytics" ON learning_analytics;

CREATE POLICY "Students manage own analytics" ON learning_analytics
  FOR ALL USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view class analytics" ON learning_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN module_class_teachers mct ON e.class_id = mct.class_id
      WHERE e.student_id = learning_analytics.student_id
      AND mct.teacher_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'leerkracht')
    )
  );

CREATE POLICY "Admins manage all analytics" ON learning_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Fix study_rooms: Remove the OR true condition
DROP POLICY IF EXISTS "Students manage study rooms" ON study_rooms;

CREATE POLICY "Users manage own study rooms" ON study_rooms
  FOR ALL USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users view active study rooms" ON study_rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage all study rooms" ON study_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- ================================================================
-- PUNT 18: Spaced Repetition System Tables
-- ================================================================

-- Create spaced repetition cards table for vocabulary learning
CREATE TABLE IF NOT EXISTS spaced_repetition_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL,
  arabic_word TEXT NOT NULL,
  translation TEXT NOT NULL,
  transliteration TEXT,
  audio_url TEXT,
  ease_factor DECIMAL(4,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE spaced_repetition_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spaced_repetition_cards
CREATE POLICY "Students manage own cards" ON spaced_repetition_cards
  FOR ALL USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_srs_cards_student_review 
  ON spaced_repetition_cards(student_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_srs_cards_vocabulary 
  ON spaced_repetition_cards(vocabulary_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_srs_cards_updated_at
  BEFORE UPDATE ON spaced_repetition_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();