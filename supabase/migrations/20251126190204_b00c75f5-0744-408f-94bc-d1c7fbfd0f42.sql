-- ============================================================================
-- CRITICAL SECURITY FIX: Address Error-Level Security Issues  
-- ============================================================================

-- ISSUE 1: Remove overly permissive profiles policy (PUBLIC_DATA_EXPOSURE)
DROP POLICY IF EXISTS "Authenticated profiles only" ON public.profiles;

-- ISSUE 3: Enable RLS on tables without RLS (MISSING_RLS)
ALTER TABLE public.completion_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- completion_criteria policies
CREATE POLICY "Authenticated users can view completion criteria"
ON public.completion_criteria FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage completion criteria"
ON public.completion_criteria FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- module_class_teachers policies
CREATE POLICY "Teachers can view their own assignments"
ON public.module_class_teachers FOR SELECT
USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage teacher assignments"
ON public.module_class_teachers FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- student_connections policies (uses follower_id and following_id)
CREATE POLICY "Users can view own student connections"
ON public.student_connections FOR SELECT
USING (follower_id = auth.uid() OR following_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create student connections"
ON public.student_connections FOR INSERT
WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete own student connections"
ON public.student_connections FOR DELETE
USING (follower_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- study_room_participants policies (uses participant_id, not user_id)
CREATE POLICY "Users can view study room participants"
ON public.study_room_participants FOR SELECT
USING (EXISTS (SELECT 1 FROM study_room_participants srp WHERE srp.room_id = study_room_participants.room_id AND srp.participant_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can join study rooms"
ON public.study_room_participants FOR INSERT
WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Users can leave study rooms"
ON public.study_room_participants FOR DELETE
USING (participant_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- scheduled_messages policies
CREATE POLICY "Admins and teachers can view scheduled messages"
ON public.scheduled_messages FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leerkracht') OR sender_id = auth.uid());

CREATE POLICY "Admins and teachers can manage scheduled messages"
ON public.scheduled_messages FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'leerkracht'));