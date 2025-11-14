-- PR10: Create RPC functions for teacher operations
-- These functions work with the existing or future teacher tables

-- Function to create teacher note
CREATE OR REPLACE FUNCTION create_teacher_note(
  p_student_id UUID,
  p_content TEXT,
  p_is_flagged BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note_id UUID;
  v_result JSONB;
BEGIN
  -- Verify teacher role
  IF NOT (has_role(auth.uid(), 'leerkracht') OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only teachers can create notes';
  END IF;

  -- Insert note (will work once table exists)
  INSERT INTO teacher_notes (teacher_id, student_id, content, is_flagged)
  VALUES (auth.uid(), p_student_id, p_content, p_is_flagged)
  RETURNING id INTO v_note_id;

  SELECT jsonb_build_object(
    'id', v_note_id,
    'student_id', p_student_id,
    'content', p_content,
    'is_flagged', p_is_flagged
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to fetch teacher notes
CREATE OR REPLACE FUNCTION fetch_teacher_notes(
  p_student_id UUID
)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify teacher role
  IF NOT (has_role(auth.uid(), 'leerkracht') OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only teachers can view notes';
  END IF;

  RETURN QUERY
  SELECT to_jsonb(tn.*) FROM teacher_notes tn
  WHERE tn.student_id = p_student_id
    AND (tn.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ORDER BY tn.created_at DESC;
END;
$$;

-- Function to update teacher note
CREATE OR REPLACE FUNCTION update_teacher_note(
  p_note_id UUID,
  p_content TEXT DEFAULT NULL,
  p_is_flagged BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE teacher_notes
  SET 
    content = COALESCE(p_content, content),
    is_flagged = COALESCE(p_is_flagged, is_flagged),
    updated_at = now()
  WHERE id = p_note_id
    AND teacher_id = auth.uid()
  RETURNING to_jsonb(teacher_notes.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Note not found or unauthorized';
  END IF;

  RETURN v_result;
END;
$$;

-- Function to delete teacher note
CREATE OR REPLACE FUNCTION delete_teacher_note(
  p_note_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM teacher_notes
  WHERE id = p_note_id
    AND teacher_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Note not found or unauthorized';
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to fetch grading rubrics
CREATE OR REPLACE FUNCTION fetch_grading_rubrics(
  p_teacher_id UUID DEFAULT NULL
)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT to_jsonb(gr.*) FROM grading_rubrics gr
  WHERE (p_teacher_id IS NULL OR gr.created_by = p_teacher_id OR gr.is_template = true)
  ORDER BY gr.created_at DESC;
END;
$$;

-- Function to create grading rubric
CREATE OR REPLACE FUNCTION create_grading_rubric(
  p_rubric_name TEXT,
  p_rubric_type TEXT,
  p_criteria JSONB,
  p_total_points INTEGER,
  p_is_template BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rubric_id UUID;
  v_result JSONB;
BEGIN
  IF NOT (has_role(auth.uid(), 'leerkracht') OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only teachers can create rubrics';
  END IF;

  INSERT INTO grading_rubrics (rubric_name, rubric_type, criteria, total_points, created_by, is_template)
  VALUES (p_rubric_name, p_rubric_type, p_criteria, p_total_points, auth.uid(), p_is_template)
  RETURNING id INTO v_rubric_id;

  SELECT to_jsonb(gr.*) FROM grading_rubrics gr
  WHERE gr.id = v_rubric_id
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to fetch message templates
CREATE OR REPLACE FUNCTION fetch_message_templates(
  p_teacher_id UUID DEFAULT NULL
)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT to_jsonb(mt.*) FROM message_templates mt
  WHERE (p_teacher_id IS NULL OR mt.created_by = p_teacher_id OR mt.is_shared = true)
  ORDER BY mt.usage_count DESC;
END;
$$;

-- Function to fetch teacher rewards
CREATE OR REPLACE FUNCTION fetch_teacher_rewards(
  p_student_id UUID
)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', tr.id,
    'teacher_id', tr.teacher_id,
    'student_id', tr.student_id,
    'reward_type', tr.reward_type,
    'reward_value', tr.reward_value,
    'reason', tr.reason,
    'awarded_at', tr.awarded_at,
    'teacher_name', p.full_name
  )
  FROM teacher_rewards tr
  LEFT JOIN profiles p ON p.id = tr.teacher_id
  WHERE tr.student_id = p_student_id
  ORDER BY tr.awarded_at DESC;
END;
$$;