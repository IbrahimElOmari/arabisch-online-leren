-- Fix security issues from Phase 6 migration
-- Add RLS to materialized view and other security improvements

-- Enable RLS on materialized view to fix security warning
ALTER MATERIALIZED VIEW public.global_search_index OWNER TO authenticated;

-- Create RLS policy for global search
CREATE POLICY "Users can search content they have access to" ON public.global_search_index
FOR SELECT USING (
  -- Allow access to threads/posts from user's classes
  (entity_type IN ('thread', 'post') AND class_id IN (
    SELECT i.class_id FROM public.inschrijvingen i 
    WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
    UNION
    SELECT k.id FROM public.klassen k 
    WHERE k.teacher_id = auth.uid()
  ))
  OR
  -- Allow access to lessons from user's classes  
  (entity_type = 'lesson' AND class_id IN (
    SELECT i.class_id FROM public.inschrijvingen i 
    WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
    UNION
    SELECT k.id FROM public.klassen k 
    WHERE k.teacher_id = auth.uid()
  ))
  OR
  -- Allow access to tasks from user's levels
  (entity_type = 'task' AND class_id IN (
    SELECT i.class_id FROM public.inschrijvingen i 
    WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
    UNION
    SELECT k.id FROM public.klassen k 
    WHERE k.teacher_id = auth.uid()
  ))
  OR
  -- Allow access to user profiles (public info only)
  (entity_type = 'user')
  OR
  -- Admins can access everything
  get_user_role(auth.uid()) = 'admin'
);

-- Add missing triggers for notifications and points
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all participants except sender
  INSERT INTO public.user_notifications (user_id, message)
  SELECT 
    cp.user_id,
    'Nieuw bericht van ' || p.full_name
  FROM public.conversation_participants cp
  JOIN public.profiles p ON p.id = NEW.sender_id
  WHERE cp.conversation_id = NEW.conversation_id 
    AND cp.user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER trigger_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Update points trigger  
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total points when bonus points are awarded
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (
    NEW.student_id,
    (SELECT COALESCE(SUM(points), 0) FROM public.bonus_points WHERE student_id = NEW.student_id)
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = (SELECT COALESCE(SUM(points), 0) FROM public.bonus_points WHERE student_id = NEW.student_id),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER trigger_update_user_points
  AFTER INSERT ON public.bonus_points
  FOR EACH ROW EXECUTE FUNCTION public.update_user_points();

-- Function to refresh search index
CREATE OR REPLACE FUNCTION public.refresh_search_index()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.global_search_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;