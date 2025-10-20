-- Migration: Secure global_search_index view with enrollment-based access control
DROP VIEW IF EXISTS public.global_search_index;

CREATE OR REPLACE VIEW public.global_search_index AS
SELECT 
  'forum_thread'::text AS entity_type,
  ft.id AS entity_id,
  ft.title,
  ft.body,
  ft.class_id,
  ft.created_at,
  ft.tsv
FROM public.forum_threads ft
WHERE ft.title IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_teacher_of_class(auth.uid(), ft.class_id)
    OR public.is_enrolled_in_class(auth.uid(), ft.class_id)
  )
UNION ALL
SELECT 
  'forum_post'::text AS entity_type,
  fp.id AS entity_id,
  fp.titel AS title,
  fp.inhoud AS body,
  fp.class_id,
  fp.created_at,
  fp.tsv
FROM public.forum_posts fp
WHERE fp.titel IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_teacher_of_class(auth.uid(), fp.class_id)
    OR public.is_enrolled_in_class(auth.uid(), fp.class_id)
  )
UNION ALL
SELECT 
  'lesson'::text AS entity_type,
  l.id AS entity_id,
  l.title,
  NULL::text AS body,
  l.class_id,
  l.created_at,
  l.tsv
FROM public.lessen l
WHERE l.title IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_teacher_of_class(auth.uid(), l.class_id)
    OR public.is_enrolled_in_class(auth.uid(), l.class_id)
  )
UNION ALL
SELECT 
  'profile'::text AS entity_type,
  p.id AS entity_id,
  p.full_name AS title,
  NULL::text AS body,
  NULL::uuid AS class_id,
  p.created_at,
  p.tsv
FROM public.profiles p
WHERE p.id = auth.uid()
  AND p.full_name IS NOT NULL;

GRANT SELECT ON public.global_search_index TO authenticated;

COMMENT ON VIEW public.global_search_index IS 
'Secured search index that enforces enrollment-based access control. Users can only search content from classes they are enrolled in, teaching, or if they are admins.';
