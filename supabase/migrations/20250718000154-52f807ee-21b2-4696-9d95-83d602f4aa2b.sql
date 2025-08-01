-- ========= Fase 0: Database Schema Expansie =========

-- 1. Forum Systeem
CREATE TABLE public.forum_threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    class_id uuid NOT NULL REFERENCES public.klassen(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL CHECK (char_length(title) > 3),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    comments_enabled BOOLEAN DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.forum_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id),
    parent_post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Evaluatie & Taken Systeem
CREATE TYPE public.submission_type AS ENUM ('text', 'file');

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    level_id uuid NOT NULL REFERENCES public.niveaus(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    required_submission_type public.submission_type NOT NULL,
    grading_scale INTEGER NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.task_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id),
    submission_content TEXT,
    submission_file_path TEXT,
    grade INTEGER,
    feedback TEXT,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (task_id, student_id)
);

-- 3. Notificatie Systeem
CREATE TABLE public.user_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Analytics Systeem
CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_start timestamp with time zone NOT NULL,
    session_end timestamp with time zone,
    duration_seconds INTEGER
);

-- Activeer Row Level Security
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies voor Forum
CREATE POLICY "Users can view forum threads for their classes"
ON public.forum_threads FOR SELECT
USING (
  class_id IN (
    SELECT i.class_id FROM inschrijvingen i 
    WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
  ) OR
  class_id IN (
    SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid()
  ) OR
  get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Users can create forum threads for their classes"
ON public.forum_threads FOR INSERT
WITH CHECK (
  class_id IN (
    SELECT i.class_id FROM inschrijvingen i 
    WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
  ) OR
  class_id IN (
    SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid()
  ) OR
  get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Admins and teachers can manage forum threads"
ON public.forum_threads FOR ALL
USING (
  get_user_role(auth.uid()) = 'admin' OR
  class_id IN (SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid())
);

CREATE POLICY "Users can view forum posts for accessible threads"
ON public.forum_posts FOR SELECT
USING (
  thread_id IN (
    SELECT ft.id FROM forum_threads ft WHERE
    ft.class_id IN (
      SELECT i.class_id FROM inschrijvingen i 
      WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
    ) OR
    ft.class_id IN (
      SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid()
    ) OR
    get_user_role(auth.uid()) = 'admin'
  )
);

CREATE POLICY "Users can create forum posts for accessible threads"
ON public.forum_posts FOR INSERT
WITH CHECK (
  thread_id IN (
    SELECT ft.id FROM forum_threads ft WHERE
    ft.class_id IN (
      SELECT i.class_id FROM inschrijvingen i 
      WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
    ) OR
    ft.class_id IN (
      SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid()
    ) OR
    get_user_role(auth.uid()) = 'admin'
  )
);

-- RLS Policies voor Tasks
CREATE POLICY "Users can view tasks for their levels"
ON public.tasks FOR SELECT
USING (
  level_id IN (
    SELECT n.id FROM niveaus n
    JOIN klassen k ON n.class_id = k.id
    JOIN inschrijvingen i ON k.id = i.class_id
    WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
  ) OR
  level_id IN (
    SELECT n.id FROM niveaus n
    JOIN klassen k ON n.class_id = k.id
    WHERE k.teacher_id = auth.uid()
  ) OR
  get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Teachers and admins can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (
  level_id IN (
    SELECT n.id FROM niveaus n
    JOIN klassen k ON n.class_id = k.id
    WHERE k.teacher_id = auth.uid()
  ) OR
  get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Teachers and admins can manage tasks"
ON public.tasks FOR ALL
USING (
  level_id IN (
    SELECT n.id FROM niveaus n
    JOIN klassen k ON n.class_id = k.id
    WHERE k.teacher_id = auth.uid()
  ) OR
  get_user_role(auth.uid()) = 'admin'
);

-- RLS Policies voor Task Submissions
CREATE POLICY "Students can view their own submissions"
ON public.task_submissions FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can create their own submissions"
ON public.task_submissions FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers and admins can view submissions for their tasks"
ON public.task_submissions FOR SELECT
USING (
  task_id IN (
    SELECT t.id FROM tasks t
    JOIN niveaus n ON t.level_id = n.id
    JOIN klassen k ON n.class_id = k.id
    WHERE k.teacher_id = auth.uid()
  ) OR
  get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Teachers and admins can grade submissions"
ON public.task_submissions FOR UPDATE
USING (
  task_id IN (
    SELECT t.id FROM tasks t
    JOIN niveaus n ON t.level_id = n.id
    JOIN klassen k ON n.class_id = k.id
    WHERE k.teacher_id = auth.uid()
  ) OR
  get_user_role(auth.uid()) = 'admin'
);

-- RLS Policies voor Notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.user_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
ON public.user_notifications FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- RLS Policies voor User Sessions
CREATE POLICY "Users can manage their own sessions"
ON public.user_sessions FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.user_sessions FOR SELECT
USING (get_user_role(auth.uid()) = 'admin');