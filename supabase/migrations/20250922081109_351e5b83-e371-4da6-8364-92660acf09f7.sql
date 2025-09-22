-- Phase 6 Feature Expansion Migration
-- Chat, Forum enhancements, Tasks improvements, Gamification, Global Search

-- 1. CHAT SYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('dm', 'class')) NOT NULL,
  class_id UUID REFERENCES public.klassen(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_type_class ON public.conversations(type, class_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by, created_at);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('member', 'owner', 'teacher', 'admin')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at);

CREATE TABLE IF NOT EXISTS public.message_reads (
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_user ON public.message_reads(user_id, read_at);

-- 2. GAMIFICATION ENHANCEMENTS
CREATE TABLE IF NOT EXISTS public.user_points (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  'alltime' as period,
  up.user_id,
  p.full_name,
  up.total_points as points,
  ROW_NUMBER() OVER (ORDER BY up.total_points DESC) as rank
FROM public.user_points up
JOIN public.profiles p ON up.user_id = p.id
UNION ALL
SELECT 
  'weekly' as period,
  bp.student_id as user_id,
  p.full_name,
  SUM(bp.points) as points,
  ROW_NUMBER() OVER (ORDER BY SUM(bp.points) DESC) as rank
FROM public.bonus_points bp
JOIN public.profiles p ON bp.student_id = p.id
WHERE bp.created_at >= NOW() - INTERVAL '7 days'
GROUP BY bp.student_id, p.full_name
ORDER BY period, rank;

-- 3. GLOBAL SEARCH VIEW
CREATE OR REPLACE VIEW public.global_search_index AS
SELECT 
  'thread' as entity_type,
  ft.id as entity_id,
  ft.title,
  ft.content as body,
  ft.class_id,
  ft.created_at,
  to_tsvector('dutch', COALESCE(ft.title, '') || ' ' || COALESCE(ft.content, '')) as tsv
FROM public.forum_threads ft
WHERE NOT COALESCE(ft.is_pinned, false)
UNION ALL
SELECT 
  'post' as entity_type,
  fp.id as entity_id,
  fp.titel as title,
  fp.inhoud as body,
  fp.class_id,
  fp.created_at,
  to_tsvector('dutch', COALESCE(fp.titel, '') || ' ' || COALESCE(fp.inhoud, '')) as tsv
FROM public.forum_posts fp
WHERE NOT COALESCE(fp.is_verwijderd, false)
UNION ALL
SELECT 
  'lesson' as entity_type,
  l.id as entity_id,
  l.title,
  l.title as body,
  l.class_id,
  l.created_at,
  to_tsvector('dutch', COALESCE(l.title, '')) as tsv
FROM public.lessen l
UNION ALL
SELECT 
  'task' as entity_type,
  t.id as entity_id,
  t.title,
  COALESCE(t.description, '') as body,
  n.class_id,
  t.created_at,
  to_tsvector('dutch', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')) as tsv
FROM public.tasks t
JOIN public.niveaus n ON t.level_id = n.id
UNION ALL
SELECT 
  'user' as entity_type,
  p.id as entity_id,
  p.full_name as title,
  p.full_name as body,
  NULL as class_id,
  p.created_at,
  to_tsvector('dutch', COALESCE(p.full_name, '')) as tsv
FROM public.profiles p;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_global_search_tsv ON public.global_search_index USING GIN(tsv);

-- 4. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_attachments', 
  'chat_attachments', 
  false, 
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task_uploads', 
  'task_uploads', 
  false, 
  104857600, -- 100MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip']
) ON CONFLICT (id) DO NOTHING;

-- 5. RLS POLICIES

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations they participate in" ON public.conversations
FOR SELECT USING (
  id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation creators and teachers can update" ON public.conversations
FOR UPDATE USING (
  auth.uid() = created_by OR 
  get_user_role(auth.uid()) IN ('admin', 'leerkracht')
);

-- Conversation Participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
FOR SELECT USING (
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Conversation owners can manage participants" ON public.conversation_participants
FOR ALL USING (
  conversation_id IN (
    SELECT c.id 
    FROM public.conversations c 
    WHERE c.created_by = auth.uid()
  ) OR get_user_role(auth.uid()) IN ('admin', 'leerkracht')
);

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON public.messages
FOR SELECT USING (
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Participants can send messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Senders can update their own messages" ON public.messages
FOR UPDATE USING (sender_id = auth.uid());

-- Message Reads
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own read status" ON public.message_reads
FOR ALL USING (user_id = auth.uid());

-- User Points
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points" ON public.user_points
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers and admins can view all points" ON public.user_points
FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'leerkracht'));

CREATE POLICY "System can manage points" ON public.user_points
FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'leerkracht'));

-- Storage Policies
CREATE POLICY "Users can upload chat attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their chat attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can upload task files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'task_uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their task uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'task_uploads' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR get_user_role(auth.uid()) IN ('admin', 'leerkracht'))
);

-- 6. TRIGGERS FOR NOTIFICATIONS
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

-- 7. REALTIME SETUP
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_submissions;