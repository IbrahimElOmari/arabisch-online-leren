-- Create les_content table for storing lesson content
CREATE TABLE IF NOT EXISTS public.les_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  niveau_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.les_content ENABLE ROW LEVEL SECURITY;

-- Create foreign key constraints
ALTER TABLE public.les_content 
ADD CONSTRAINT les_content_niveau_id_fkey 
FOREIGN KEY (niveau_id) REFERENCES public.niveaus(id) ON DELETE CASCADE;

ALTER TABLE public.les_content 
ADD CONSTRAINT les_content_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create policies
CREATE POLICY "Students can view content for enrolled niveaus" 
ON public.les_content 
FOR SELECT 
USING (niveau_id IN (
  SELECT n.id
  FROM niveaus n
  JOIN klassen k ON n.class_id = k.id
  JOIN inschrijvingen i ON k.id = i.class_id
  WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
));

CREATE POLICY "Teachers can manage content for their niveaus" 
ON public.les_content 
FOR ALL 
USING (niveau_id IN (
  SELECT n.id
  FROM niveaus n
  JOIN klassen k ON n.class_id = k.id
  WHERE k.teacher_id = auth.uid()
));

CREATE POLICY "Admins can manage all content" 
ON public.les_content 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_les_content_updated_at
BEFORE UPDATE ON public.les_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();