-- =====================================================
-- MARKETING, KNOWLEDGE BASE & ONBOARDING TABLES
-- =====================================================

-- 1. TESTIMONIALS
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  role TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  avatar_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials" ON public.testimonials
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can manage all testimonials" ON public.testimonials
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. LEAD MAGNETS
CREATE TABLE public.lead_magnets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('ebook', 'checklist', 'video', 'template')),
  file_url TEXT,
  thumbnail_url TEXT,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lead_magnets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active lead magnets" ON public.lead_magnets
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage lead magnets" ON public.lead_magnets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. LEAD MAGNET DOWNLOADS
CREATE TABLE public.lead_magnet_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_magnet_id UUID REFERENCES public.lead_magnets(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  user_id UUID REFERENCES public.profiles(id),
  ip_address TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lead_magnet_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their own downloads" ON public.lead_magnet_downloads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all downloads" ON public.lead_magnet_downloads
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 4. REFERRALS
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) NOT NULL,
  referee_id UUID REFERENCES public.profiles(id),
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'enrolled', 'rewarded')),
  reward_type TEXT,
  reward_amount INTEGER,
  referee_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals" ON public.referrals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. REFERRAL REWARDS CONFIG
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL,
  min_referrals INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards" ON public.referral_rewards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rewards" ON public.referral_rewards
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 6. FAQ ITEMS
CREATE TABLE public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('account', 'billing', 'learning', 'technical', 'community')),
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published FAQ" ON public.faq_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage FAQ" ON public.faq_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. VIDEO TUTORIALS
CREATE TABLE public.video_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  category TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  order_index INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published tutorials" ON public.video_tutorials
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage tutorials" ON public.video_tutorials
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 8. COMMUNITY GUIDELINES
CREATE TABLE public.community_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  content_nl TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.community_guidelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view current guidelines" ON public.community_guidelines
  FOR SELECT USING (is_current = true);

CREATE POLICY "Admins can manage guidelines" ON public.community_guidelines
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 9. USER ONBOARDING STATE
CREATE TABLE public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
  current_step INTEGER DEFAULT 1,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  tour_completed BOOLEAN DEFAULT false,
  welcome_email_sent BOOLEAN DEFAULT false,
  study_group_matched BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding" ON public.user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON public.user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create onboarding" ON public.user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding" ON public.user_onboarding
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 10. STUDY GROUPS
CREATE TABLE public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  niveau_id UUID REFERENCES public.niveaus(id),
  max_members INTEGER DEFAULT 10,
  current_members INTEGER DEFAULT 0,
  meeting_schedule TEXT,
  meeting_day TEXT,
  meeting_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active groups" ON public.study_groups
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create groups" ON public.study_groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update groups" ON public.study_groups
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all groups" ON public.study_groups
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 11. STUDY GROUP MEMBERS
CREATE TABLE public.study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'leader', 'moderator')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members" ON public.study_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members sgm 
      WHERE sgm.group_id = study_group_members.group_id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups" ON public.study_group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.study_group_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" ON public.study_group_members
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 12. WELCOME EMAIL QUEUE
CREATE TABLE public.welcome_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'day1', 'day3', 'day7')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.welcome_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email queue" ON public.welcome_email_queue
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- HELPER FUNCTIONS

-- Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update study group member count trigger
CREATE OR REPLACE FUNCTION public.update_study_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.study_groups 
    SET current_members = current_members + 1 
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.study_groups 
    SET current_members = current_members - 1 
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_member_count
AFTER INSERT OR DELETE ON public.study_group_members
FOR EACH ROW EXECUTE FUNCTION public.update_study_group_member_count();

-- Increment lead magnet download count
CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.lead_magnets 
  SET download_count = download_count + 1 
  WHERE id = NEW.lead_magnet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER increment_lead_magnet_downloads
AFTER INSERT ON public.lead_magnet_downloads
FOR EACH ROW EXECUTE FUNCTION public.increment_download_count();

-- Insert initial referral rewards
INSERT INTO public.referral_rewards (tier, min_referrals, reward_type, reward_value, description) VALUES
  ('bronze', 1, 'credits', 10, '10 credits voor je eerste referral'),
  ('silver', 5, 'discount', 20, '20% korting op volgende maand'),
  ('gold', 10, 'free_month', 1, '1 maand gratis premium');

-- Insert initial FAQ items
INSERT INTO public.faq_items (question, answer, category, order_index) VALUES
  ('Hoe maak ik een account aan?', 'Klik op "Registreren" rechtsboven en vul je gegevens in. Je ontvangt een bevestigingsmail.', 'account', 1),
  ('Hoe reset ik mijn wachtwoord?', 'Klik op "Wachtwoord vergeten" op de loginpagina en volg de instructies in de email.', 'account', 2),
  ('Welke abonnementen zijn er?', 'We bieden Gratis, Basis (€9,99/maand) en Premium (€19,99/maand) abonnementen aan.', 'billing', 1),
  ('Hoe annuleer ik mijn abonnement?', 'Ga naar Instellingen > Abonnement en klik op "Annuleren". Je behoudt toegang tot einde periode.', 'billing', 2),
  ('Hoe start ik een les?', 'Ga naar Dashboard > Lessen en klik op de les die je wilt starten.', 'learning', 1),
  ('Kan ik offline leren?', 'Ja, met de PWA kun je lessen downloaden voor offline gebruik.', 'technical', 1),
  ('Hoe stel ik een vraag in het forum?', 'Ga naar Community > Forum en klik op "Nieuwe vraag". Kies een categorie en beschrijf je vraag.', 'community', 1);

-- Insert initial community guidelines
INSERT INTO public.community_guidelines (version, content_nl, content_en, content_ar, is_current, published_at) VALUES
  ('1.0', 
   '# Community Richtlijnen

## Respect
Behandel iedereen met respect. Discriminatie, pesten of beledigende taal wordt niet getolereerd.

## Hulpvaardigheid
Help elkaar bij het leren. Deel kennis en ervaringen.

## Veiligheid
Deel geen persoonlijke informatie. Meld ongepast gedrag aan moderators.

## Kwaliteit
Stel duidelijke vragen. Geef constructieve feedback.',
   
   '# Community Guidelines

## Respect
Treat everyone with respect. Discrimination, bullying or offensive language will not be tolerated.

## Helpfulness
Help each other learn. Share knowledge and experiences.

## Safety
Do not share personal information. Report inappropriate behavior to moderators.

## Quality
Ask clear questions. Give constructive feedback.',
   
   '# إرشادات المجتمع

## الاحترام
عامل الجميع باحترام. لن يتم التسامح مع التمييز أو التنمر أو اللغة المسيئة.

## المساعدة
ساعدوا بعضكم البعض في التعلم. شاركوا المعرفة والخبرات.

## السلامة
لا تشارك معلومات شخصية. أبلغ عن السلوك غير اللائق للمشرفين.

## الجودة
اطرح أسئلة واضحة. قدم ملاحظات بناءة.',
   
   true, now());