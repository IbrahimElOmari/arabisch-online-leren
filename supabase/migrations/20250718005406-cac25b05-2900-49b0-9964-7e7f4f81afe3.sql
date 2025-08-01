-- Add likes/dislikes system to forum
ALTER TABLE forum_posts ADD COLUMN likes_count INTEGER DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN dislikes_count INTEGER DEFAULT 0;

-- Create likes table
CREATE TABLE forum_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL, -- true for like, false for dislike
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on forum_likes
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for forum_likes
CREATE POLICY "Users can view likes for accessible posts" ON forum_likes
FOR SELECT USING (
  post_id IN (
    SELECT fp.id FROM forum_posts fp 
    WHERE (
      fp.class_id IN (
        SELECT i.class_id FROM inschrijvingen i 
        WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
      ) OR 
      fp.class_id IN (
        SELECT k.id FROM klassen k 
        WHERE k.teacher_id = auth.uid()
      ) OR 
      get_user_role(auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "Users can create likes for accessible posts" ON forum_likes
FOR INSERT WITH CHECK (
  post_id IN (
    SELECT fp.id FROM forum_posts fp 
    WHERE (
      fp.class_id IN (
        SELECT i.class_id FROM inschrijvingen i 
        WHERE i.student_id = auth.uid() AND i.payment_status = 'paid'
      ) OR 
      fp.class_id IN (
        SELECT k.id FROM klassen k 
        WHERE k.teacher_id = auth.uid()
      ) OR 
      get_user_role(auth.uid()) = 'admin'
    )
  ) AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own likes" ON forum_likes
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own likes" ON forum_likes
FOR DELETE USING (user_id = auth.uid());