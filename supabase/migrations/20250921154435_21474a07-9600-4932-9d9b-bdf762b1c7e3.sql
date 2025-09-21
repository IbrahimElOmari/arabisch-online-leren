-- Create analytics_events table for performance and user analytics
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

-- Create indexes for performance
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);