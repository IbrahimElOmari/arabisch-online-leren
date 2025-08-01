-- Create calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'custom', -- 'vacation', 'custom', 'lesson'
  created_by UUID REFERENCES auth.users(id),
  class_id UUID REFERENCES klassen(id), -- optional, for class-specific events
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Everyone can view vacation events
CREATE POLICY "Everyone can view vacation events" 
ON public.calendar_events 
FOR SELECT 
USING (event_type = 'vacation');

-- Students can view events for their enrolled classes
CREATE POLICY "Students can view class events" 
ON public.calendar_events 
FOR SELECT 
USING (
  event_type = 'custom' AND 
  (class_id IS NULL OR class_id IN (
    SELECT inschrijvingen.class_id 
    FROM inschrijvingen 
    WHERE inschrijvingen.student_id = auth.uid() 
    AND inschrijvingen.payment_status = 'paid'
  ))
);

-- Teachers can manage events for their classes
CREATE POLICY "Teachers can manage class events" 
ON public.calendar_events 
FOR ALL 
USING (
  get_user_role(auth.uid()) = 'leerkracht' AND 
  (class_id IS NULL OR class_id IN (
    SELECT klassen.id 
    FROM klassen 
    WHERE klassen.teacher_id = auth.uid()
  ))
);

-- Admins can manage all events
CREATE POLICY "Admins can manage all events" 
ON public.calendar_events 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Flemish school holidays for 2024-2025
INSERT INTO public.calendar_events (title, start_date, end_date, event_type, description) VALUES
('Herfstvakantie', '2024-10-28', '2024-11-03', 'vacation', 'Herfstvakantie in Vlaanderen'),
('Kerstvakantie', '2024-12-23', '2025-01-05', 'vacation', 'Kerstvakantie in Vlaanderen'),
('Krokusvakantie', '2025-02-24', '2025-03-02', 'vacation', 'Krokusvakantie in Vlaanderen'),
('Paasvakantie', '2025-04-14', '2025-04-27', 'vacation', 'Paasvakantie in Vlaanderen'),
('Zomervakantie', '2025-07-01', '2025-08-31', 'vacation', 'Zomervakantie in Vlaanderen');