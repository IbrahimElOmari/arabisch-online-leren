-- Create niveaus table for class levels
CREATE TABLE public.niveaus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  niveau_nummer INTEGER NOT NULL,
  naam TEXT NOT NULL,
  beschrijving TEXT,
  is_actief BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, niveau_nummer)
);

-- Create vragen table (separated from lessen for reusability)
CREATE TABLE public.vragen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  niveau_id UUID NOT NULL,
  vraag_tekst TEXT NOT NULL,
  vraag_type TEXT NOT NULL CHECK (vraag_type IN ('open', 'enkelvoudig', 'meervoudig')),
  opties JSON, -- For multiple choice options
  correct_antwoord JSON, -- Correct answers
  audio_url TEXT,
  video_url TEXT,
  volgorde INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create antwoorden table for student answers
CREATE TABLE public.antwoorden (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  vraag_id UUID NOT NULL,
  antwoord JSON NOT NULL, -- Student's answer(s)
  is_correct BOOLEAN,
  beoordeeld_door UUID, -- Teacher who graded (for open questions)
  feedback TEXT,
  punten INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_posts table
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  niveau_id UUID,
  author_id UUID NOT NULL,
  titel TEXT NOT NULL,
  inhoud TEXT NOT NULL,
  is_gerapporteerd BOOLEAN DEFAULT false,
  is_verwijderd BOOLEAN DEFAULT false,
  verwijderd_door UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_reacties table
CREATE TABLE public.forum_reacties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  author_id UUID NOT NULL,
  inhoud TEXT NOT NULL,
  is_gerapporteerd BOOLEAN DEFAULT false,
  is_verwijderd BOOLEAN DEFAULT false,
  verwijderd_door UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_log table for tracking admin actions
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  actie TEXT NOT NULL,
  details JSON,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.niveaus ADD CONSTRAINT niveaus_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES public.klassen(id) ON DELETE CASCADE;

ALTER TABLE public.vragen ADD CONSTRAINT vragen_niveau_id_fkey 
  FOREIGN KEY (niveau_id) REFERENCES public.niveaus(id) ON DELETE CASCADE;

ALTER TABLE public.antwoorden ADD CONSTRAINT antwoorden_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.antwoorden ADD CONSTRAINT antwoorden_vraag_id_fkey 
  FOREIGN KEY (vraag_id) REFERENCES public.vragen(id) ON DELETE CASCADE;

ALTER TABLE public.antwoorden ADD CONSTRAINT antwoorden_beoordeeld_door_fkey 
  FOREIGN KEY (beoordeeld_door) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES public.klassen(id) ON DELETE CASCADE;

ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_niveau_id_fkey 
  FOREIGN KEY (niveau_id) REFERENCES public.niveaus(id) ON DELETE SET NULL;

ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_verwijderd_door_fkey 
  FOREIGN KEY (verwijderd_door) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.forum_reacties ADD CONSTRAINT forum_reacties_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;

ALTER TABLE public.forum_reacties ADD CONSTRAINT forum_reacties_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.forum_reacties ADD CONSTRAINT forum_reacties_verwijderd_door_fkey 
  FOREIGN KEY (verwijderd_door) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS on all new tables
ALTER TABLE public.niveaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vragen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.antwoorden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reacties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for niveaus
CREATE POLICY "Everyone can view niveaus" ON public.niveaus FOR SELECT USING (true);
CREATE POLICY "Teachers can manage niveaus for their klassen" ON public.niveaus FOR ALL 
  USING (class_id IN (SELECT id FROM klassen WHERE teacher_id = auth.uid()));
CREATE POLICY "Admins can manage all niveaus" ON public.niveaus FOR ALL 
  USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- RLS Policies for vragen
CREATE POLICY "Students can view vragen for enrolled niveaus" ON public.vragen FOR SELECT 
  USING (niveau_id IN (
    SELECT n.id FROM niveaus n 
    JOIN klassen k ON n.class_id = k.id 
    JOIN inschrijvingen i ON k.id = i.class_id 
    WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
  ));
CREATE POLICY "Teachers can manage vragen for their niveaus" ON public.vragen FOR ALL 
  USING (niveau_id IN (
    SELECT n.id FROM niveaus n 
    JOIN klassen k ON n.class_id = k.id 
    WHERE k.teacher_id = auth.uid()
  ));
CREATE POLICY "Admins can manage all vragen" ON public.vragen FOR ALL 
  USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- RLS Policies for antwoorden
CREATE POLICY "Students can view own antwoorden" ON public.antwoorden FOR SELECT 
  USING (student_id = auth.uid());
CREATE POLICY "Students can create own antwoorden" ON public.antwoorden FOR INSERT 
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers can view antwoorden for their vragen" ON public.antwoorden FOR SELECT 
  USING (vraag_id IN (
    SELECT v.id FROM vragen v 
    JOIN niveaus n ON v.niveau_id = n.id 
    JOIN klassen k ON n.class_id = k.id 
    WHERE k.teacher_id = auth.uid()
  ));
CREATE POLICY "Teachers can update antwoorden for their vragen" ON public.antwoorden FOR UPDATE 
  USING (vraag_id IN (
    SELECT v.id FROM vragen v 
    JOIN niveaus n ON v.niveau_id = n.id 
    JOIN klassen k ON n.class_id = k.id 
    WHERE k.teacher_id = auth.uid()
  ));
CREATE POLICY "Admins can manage all antwoorden" ON public.antwoorden FOR ALL 
  USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- RLS Policies for forum_posts
CREATE POLICY "Users can view forum_posts for their klassen" ON public.forum_posts FOR SELECT 
  USING (
    class_id IN (
      SELECT i.class_id FROM inschrijvingen i WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
    ) OR 
    class_id IN (
      SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid()
    ) OR 
    get_user_role(auth.uid()) = 'admin'::app_role
  );
CREATE POLICY "Users can create forum_posts for their klassen" ON public.forum_posts FOR INSERT 
  WITH CHECK (
    class_id IN (
      SELECT i.class_id FROM inschrijvingen i WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
    ) OR 
    class_id IN (
      SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid()
    ) OR 
    get_user_role(auth.uid()) = 'admin'::app_role
  );
CREATE POLICY "Users can update own forum_posts" ON public.forum_posts FOR UPDATE 
  USING (author_id = auth.uid());
CREATE POLICY "Admins and teachers can moderate forum_posts" ON public.forum_posts FOR UPDATE 
  USING (
    get_user_role(auth.uid()) = 'admin'::app_role OR 
    class_id IN (SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid())
  );

-- RLS Policies for forum_reacties
CREATE POLICY "Users can view forum_reacties for accessible posts" ON public.forum_reacties FOR SELECT 
  USING (
    post_id IN (
      SELECT fp.id FROM forum_posts fp WHERE 
        fp.class_id IN (
          SELECT i.class_id FROM inschrijvingen i WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
        ) OR 
        fp.class_id IN (
          SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid()
        ) OR 
        get_user_role(auth.uid()) = 'admin'::app_role
    )
  );
CREATE POLICY "Users can create forum_reacties for accessible posts" ON public.forum_reacties FOR INSERT 
  WITH CHECK (
    post_id IN (
      SELECT fp.id FROM forum_posts fp WHERE 
        fp.class_id IN (
          SELECT i.class_id FROM inschrijvingen i WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
        ) OR 
        fp.class_id IN (
          SELECT k.id FROM klassen k WHERE k.teacher_id = auth.uid()
        ) OR 
        get_user_role(auth.uid()) = 'admin'::app_role
    )
  );
CREATE POLICY "Users can update own forum_reacties" ON public.forum_reacties FOR UPDATE 
  USING (author_id = auth.uid());

-- RLS Policies for audit_log
CREATE POLICY "Admins can view all audit_log" ON public.audit_log FOR SELECT 
  USING (get_user_role(auth.uid()) = 'admin'::app_role);
CREATE POLICY "System can insert audit_log" ON public.audit_log FOR INSERT 
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_niveaus_updated_at BEFORE UPDATE ON public.niveaus 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vragen_updated_at BEFORE UPDATE ON public.vragen 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_antwoorden_updated_at BEFORE UPDATE ON public.antwoorden 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_reacties_updated_at BEFORE UPDATE ON public.forum_reacties 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data: Create initial niveaus for existing klassen
INSERT INTO public.niveaus (class_id, niveau_nummer, naam, beschrijving)
SELECT 
  k.id,
  n.niveau_nummer,
  'Niveau ' || n.niveau_nummer,
  'Beschrijving voor niveau ' || n.niveau_nummer
FROM public.klassen k
CROSS JOIN (
  VALUES (1), (2), (3), (4)
) AS n(niveau_nummer);