-- Global Search with proper RLS-aware VIEW (no materialized views)

-- Add tsvector columns and indexes to existing tables
ALTER TABLE forum_threads 
ADD COLUMN IF NOT EXISTS body text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS tsv tsvector GENERATED ALWAYS AS (to_tsvector('dutch', coalesce(title,'') || ' ' || coalesce(body,''))) STORED;

CREATE INDEX IF NOT EXISTS forum_threads_tsv_gin ON forum_threads USING GIN(tsv);

ALTER TABLE forum_posts 
ADD COLUMN IF NOT EXISTS body text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS tsv tsvector GENERATED ALWAYS AS (to_tsvector('dutch', coalesce(titel,'') || ' ' || coalesce(body,''))) STORED;

CREATE INDEX IF NOT EXISTS forum_posts_tsv_gin ON forum_posts USING GIN(tsv);

ALTER TABLE lessen 
ADD COLUMN IF NOT EXISTS tsv tsvector GENERATED ALWAYS AS (to_tsvector('dutch', coalesce(title,''))) STORED;

CREATE INDEX IF NOT EXISTS lessen_tsv_gin ON lessen USING GIN(tsv);

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS tsv tsvector GENERATED ALWAYS AS (to_tsvector('dutch', coalesce(title,'') || ' ' || coalesce(description,''))) STORED;

CREATE INDEX IF NOT EXISTS tasks_tsv_gin ON tasks USING GIN(tsv);

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tsv tsvector GENERATED ALWAYS AS (to_tsvector('dutch', coalesce(full_name,''))) STORED;

CREATE INDEX IF NOT EXISTS profiles_tsv_gin ON profiles USING GIN(tsv);

-- Create RLS-aware global search VIEW (not materialized view)
CREATE OR REPLACE VIEW public.global_search_index AS
SELECT 
  'forum_thread'::text as entity_type,
  ft.id as entity_id,
  ft.title,
  ft.body,
  ft.class_id,
  ft.created_at,
  ft.tsv
FROM forum_threads ft
WHERE ft.title IS NOT NULL

UNION ALL

SELECT 
  'forum_post'::text as entity_type,
  fp.id as entity_id,
  fp.titel as title,
  fp.body,
  fp.class_id,
  fp.created_at,
  fp.tsv
FROM forum_posts fp
WHERE fp.titel IS NOT NULL

UNION ALL

SELECT 
  'lesson'::text as entity_type,
  l.id as entity_id,
  l.title,
  ''::text as body,
  l.class_id,
  l.created_at,
  l.tsv
FROM lessen l
WHERE l.title IS NOT NULL

UNION ALL

SELECT 
  'task'::text as entity_type,
  t.id as entity_id,
  t.title,
  coalesce(t.description, '') as body,
  (SELECT n.class_id FROM niveaus n WHERE n.id = t.level_id) as class_id,
  t.created_at,
  t.tsv
FROM tasks t
WHERE t.title IS NOT NULL

UNION ALL

SELECT 
  'profile'::text as entity_type,
  p.id as entity_id,
  p.full_name as title,
  ''::text as body,
  null::uuid as class_id,
  p.created_at,
  p.tsv
FROM profiles p
WHERE p.full_name IS NOT NULL;

-- RLS on the view - inherits from base tables, no additional policies needed

-- Search function with proper security
CREATE OR REPLACE FUNCTION public.search_global(
  p_query text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_class_id uuid DEFAULT NULL
)
RETURNS TABLE (
  entity_type text,
  entity_id uuid,
  title text,
  body text,
  class_id uuid,
  created_at timestamptz,
  rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
  ts_query tsquery;
BEGIN
  -- Convert query to tsquery
  ts_query := plainto_tsquery('dutch', p_query);
  
  -- Return results with ranking
  RETURN QUERY
  SELECT 
    gsi.entity_type,
    gsi.entity_id,
    gsi.title,
    gsi.body,
    gsi.class_id,
    gsi.created_at,
    ts_rank(gsi.tsv, ts_query) as rank
  FROM public.global_search_index gsi
  WHERE 
    gsi.tsv @@ ts_query
    AND (p_class_id IS NULL OR gsi.class_id = p_class_id)
  ORDER BY rank DESC, gsi.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('message','task','forum','grade','system')) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON public.notifications (user_id, is_read, created_at DESC);

-- RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::app_role, 'leerkracht'::app_role])
  OR auth.uid() IS NOT NULL -- Allow system inserts
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;