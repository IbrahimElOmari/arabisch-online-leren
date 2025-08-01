-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'leerkracht', 'leerling');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'leerling',
  parent_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create klassen table
CREATE TABLE public.klassen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inschrijvingen table
CREATE TABLE public.inschrijvingen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.klassen(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Create lessen table
CREATE TABLE public.lessen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.klassen(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT,
  live_lesson_datetime TIMESTAMP WITH TIME ZONE,
  live_lesson_url TEXT,
  preparation_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create aanwezigheid table
CREATE TABLE public.aanwezigheid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessen(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('aanwezig', 'afwezig')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.klassen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inschrijvingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aanwezigheid ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, parent_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'leerling'),
    NEW.raw_user_meta_data ->> 'parent_email'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for klassen
CREATE POLICY "Everyone can view klassen" ON public.klassen
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage klassen" ON public.klassen
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Teachers can view assigned klassen" ON public.klassen
  FOR SELECT USING (teacher_id = auth.uid());

-- RLS Policies for inschrijvingen
CREATE POLICY "Students can view own inschrijvingen" ON public.inschrijvingen
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all inschrijvingen" ON public.inschrijvingen
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Teachers can view inschrijvingen for their klassen" ON public.inschrijvingen
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM public.klassen WHERE teacher_id = auth.uid()
    )
  );

-- RLS Policies for lessen
CREATE POLICY "Students can view lessen for enrolled klassen" ON public.lessen
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM public.inschrijvingen 
      WHERE student_id = auth.uid() AND payment_status = 'paid'
    )
  );

CREATE POLICY "Teachers can manage lessen for assigned klassen" ON public.lessen
  FOR ALL USING (
    class_id IN (
      SELECT id FROM public.klassen WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all lessen" ON public.lessen
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for aanwezigheid
CREATE POLICY "Students can view own aanwezigheid" ON public.aanwezigheid
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage aanwezigheid for their klassen" ON public.aanwezigheid
  FOR ALL USING (
    lesson_id IN (
      SELECT l.id FROM public.lessen l
      JOIN public.klassen k ON l.class_id = k.id
      WHERE k.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all aanwezigheid" ON public.aanwezigheid
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_klassen_updated_at
  BEFORE UPDATE ON public.klassen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inschrijvingen_updated_at
  BEFORE UPDATE ON public.inschrijvingen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessen_updated_at
  BEFORE UPDATE ON public.lessen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();