-- PR4: Drop and recreate waiting_list cleanly
DROP TABLE IF EXISTS public.waiting_list CASCADE;

CREATE TABLE public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(enrollment_id)
);

ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own waiting list"
  ON public.waiting_list FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE student_id = auth.uid()));

CREATE POLICY "Admins manage waiting list"
  ON public.waiting_list FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System inserts waiting list"
  ON public.waiting_list FOR INSERT
  WITH CHECK (enrollment_id IN (SELECT id FROM public.enrollments WHERE student_id = auth.uid()));

CREATE INDEX idx_waiting_list_status ON public.waiting_list(status, requested_at);
CREATE INDEX idx_waiting_list_enrollment ON public.waiting_list(enrollment_id);

-- PR5: Forum post views
DROP TABLE IF EXISTS public.forum_post_views CASCADE;

CREATE TABLE public.forum_post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.forum_post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users track own post views"
  ON public.forum_post_views FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- PR6: Audit triggers
DROP TRIGGER IF EXISTS audit_content_library_changes ON public.content_library;
DROP FUNCTION IF EXISTS public.audit_content_changes();

CREATE FUNCTION public.audit_content_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, new_values, severity)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'CONTENT_CREATED',
      'content_library',
      NEW.id::text,
      to_jsonb(NEW),
      'info'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, old_values, new_values, severity)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      CASE 
        WHEN NEW.status = 'published' AND COALESCE(OLD.status, 'draft') != 'published' THEN 'CONTENT_PUBLISHED'
        WHEN NEW.status = 'archived' AND COALESCE(OLD.status, 'draft') != 'archived' THEN 'CONTENT_ARCHIVED'
        ELSE 'CONTENT_UPDATED'
      END,
      'content_library',
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW),
      CASE WHEN NEW.status != COALESCE(OLD.status, 'draft') THEN 'warning' ELSE 'info' END
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, old_values, severity)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'CONTENT_DELETED',
      'content_library',
      OLD.id::text,
      to_jsonb(OLD),
      'warning'
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_content_library_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.content_library
  FOR EACH ROW EXECUTE FUNCTION public.audit_content_changes();

-- Forum audit trigger
DROP TRIGGER IF EXISTS audit_forum_posts_changes ON public.forum_posts;
DROP FUNCTION IF EXISTS public.audit_forum_changes();

CREATE FUNCTION public.audit_forum_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, new_values, severity)
    VALUES (
      NEW.author_id,
      'FORUM_POST_CREATED',
      'forum_post',
      NEW.id::text,
      jsonb_build_object('title', NEW.titel, 'class_id', NEW.class_id, 'niveau_id', NEW.niveau_id),
      'info'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, old_values, new_values, severity)
    VALUES (
      COALESCE(auth.uid(), NEW.author_id),
      CASE 
        WHEN NEW.is_verwijderd AND COALESCE(OLD.is_verwijderd, false) = false THEN 'FORUM_POST_DELETED'
        WHEN NEW.is_gerapporteerd AND COALESCE(OLD.is_gerapporteerd, false) = false THEN 'FORUM_POST_REPORTED'
        ELSE 'FORUM_POST_UPDATED'
      END,
      'forum_post',
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW),
      CASE 
        WHEN NEW.is_verwijderd OR NEW.is_gerapporteerd THEN 'warning'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_forum_posts_changes
  AFTER INSERT OR UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.audit_forum_changes();