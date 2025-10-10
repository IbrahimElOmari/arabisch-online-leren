-- Maak een enum voor applicatierollen
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'leerkracht', 'leerling');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Maak de user_roles-tabel
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Schakel RLS in
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Service role manages user_roles" ON public.user_roles;
CREATE POLICY "Service role manages user_roles"
  ON public.user_roles
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- has_role functie
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Migreer bestaande rolgegevens
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles WHERE role IS NOT NULL
ON CONFLICT DO NOTHING;