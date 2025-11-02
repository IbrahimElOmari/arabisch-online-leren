-- PR4: Placement Test & Class Assignment - Without audit trigger

-- waiting_list table for when classes are full
CREATE TABLE IF NOT EXISTS public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ,
  UNIQUE(enrollment_id)
);

-- Enable RLS on waiting_list
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies for waiting_list
CREATE POLICY "Students view own waiting_list entries"
  ON public.waiting_list FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM public.enrollments WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all waiting_list entries"
  ON public.waiting_list FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert waiting_list entries"
  ON public.waiting_list FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_waiting_list_enrollment ON public.waiting_list(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_added_at ON public.waiting_list(added_at);

-- Update placement_results to ensure proper structure
ALTER TABLE public.placement_results 
  ADD COLUMN IF NOT EXISTS test_name TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add indexes for placement queries
CREATE INDEX IF NOT EXISTS idx_placement_results_student ON public.placement_results(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_results_test ON public.placement_results(placement_test_id);
CREATE INDEX IF NOT EXISTS idx_placement_results_level ON public.placement_results(assigned_level_id);

-- Ensure placement_tests has proper indexes
CREATE INDEX IF NOT EXISTS idx_placement_tests_module ON public.placement_tests(module_id);
CREATE INDEX IF NOT EXISTS idx_placement_tests_active ON public.placement_tests(is_active) WHERE is_active = true;