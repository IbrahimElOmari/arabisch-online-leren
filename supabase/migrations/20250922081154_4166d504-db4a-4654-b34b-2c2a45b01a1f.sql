-- Phase 6 Feature Expansion Migration (Corrected)
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

-- 3. GLOBAL SEARCH MATERIALIZED VIEW
CREATE MATERIALIZED VIEW IF NOT EXISTS public.global_search_index AS
SELECT 
  'thread' as entity_type,
  ft.id as entity_id,
  ft.title,
  ft.content as body,
  ft.class_id,
  ft.created_at,
  to_tsvector('dutch', COALESCE(ft.title, '') || ' ' || COALESCE(ft.content, '')) as tsv
FROM public.forum_threads ft
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

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_global_search_tsv ON public.global_search_index USING GIN(tsv);
CREATE INDEX IF NOT EXISTS idx_global_search_entity ON public.global_search_index(entity_type, entity_id);

-- 4. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_attachments', 
  'chat_attachments', 
  false, 
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task_uploads', 
  'task_uploads', 
  false, 
  104857600,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/zip']
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

CREATE POLICY "Users can join conversations" ON public.conversation_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

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

CREATE POLICY "Users can view chat attachments in their conversations" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat_attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. REALTIME SETUP
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;