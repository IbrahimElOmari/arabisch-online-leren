-- =====================================================
-- Add RLS to Remaining Tables
-- PR13 - Security Hardening
-- =====================================================

-- student_connections (follower/following relationship)
ALTER TABLE public.student_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections"
ON public.student_connections
FOR SELECT
USING (
  auth.uid() = follower_id
  OR auth.uid() = following_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create connections"
ON public.student_connections
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their connections"
ON public.student_connections
FOR DELETE
USING (auth.uid() = follower_id);

-- study_room_participants
ALTER TABLE public.study_room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view room members"
ON public.study_room_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.study_room_participants srp
    WHERE srp.room_id = study_room_participants.room_id
      AND srp.participant_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'leerkracht')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can join rooms"
ON public.study_room_participants
FOR INSERT
WITH CHECK (auth.uid() = participant_id);

-- scheduled_messages
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their scheduled messages"
ON public.scheduled_messages
FOR ALL
USING (
  auth.uid() = sender_id
  OR public.has_role(auth.uid(), 'admin')
);

-- module_class_teachers
ALTER TABLE public.module_class_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers view their assignments"
ON public.module_class_teachers
FOR SELECT
USING (
  auth.uid() = teacher_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins manage teacher assignments"
ON public.module_class_teachers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- completion_criteria
ALTER TABLE public.completion_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers and admins view completion criteria"
ON public.completion_criteria
FOR SELECT
USING (
  public.has_role(auth.uid(), 'leerkracht')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins modify completion criteria"
ON public.completion_criteria
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));