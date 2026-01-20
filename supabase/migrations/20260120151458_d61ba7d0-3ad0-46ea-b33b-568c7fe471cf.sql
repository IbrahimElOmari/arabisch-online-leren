-- =====================================================
-- FIX: RLS Policies voor admin/leerkracht INSERT op tasks en vragen
-- =====================================================

-- TASKS: SELECT policy voor admin en leerkracht
DROP POLICY IF EXISTS "Users can view tasks for their levels" ON tasks;
CREATE POLICY "Users can view tasks for their levels" ON tasks
  FOR SELECT USING (
    -- Admin kan alles zien
    get_user_role(auth.uid()) = 'admin'
    OR
    -- Leerkracht kan taken zien voor eigen klassen
    level_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      WHERE k.teacher_id = auth.uid()
    )
    OR
    -- Student kan taken zien voor ingeschreven klassen
    level_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      JOIN inschrijvingen i ON k.id = i.class_id
      WHERE i.student_id = auth.uid()
    )
  );

-- TASKS: INSERT policy voor admin en leerkracht
DROP POLICY IF EXISTS "Teachers and admins can create tasks" ON tasks;
CREATE POLICY "Teachers and admins can create tasks" ON tasks
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Admin mag overal taken aanmaken
      get_user_role(auth.uid()) = 'admin'
      OR
      -- Leerkracht mag taken aanmaken voor eigen niveaus
      level_id IN (
        SELECT n.id FROM niveaus n
        JOIN klassen k ON n.class_id = k.id
        WHERE k.teacher_id = auth.uid()
      )
    )
  );

-- TASKS: UPDATE policy
DROP POLICY IF EXISTS "Teachers and admins can update tasks" ON tasks;
CREATE POLICY "Teachers and admins can update tasks" ON tasks
  FOR UPDATE USING (
    get_user_role(auth.uid()) = 'admin'
    OR author_id = auth.uid()
    OR level_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      WHERE k.teacher_id = auth.uid()
    )
  );

-- TASKS: DELETE policy
DROP POLICY IF EXISTS "Teachers and admins can delete tasks" ON tasks;
CREATE POLICY "Teachers and admins can delete tasks" ON tasks
  FOR DELETE USING (
    get_user_role(auth.uid()) = 'admin'
    OR author_id = auth.uid()
    OR level_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      WHERE k.teacher_id = auth.uid()
    )
  );

-- VRAGEN: SELECT policy voor admin en leerkracht
DROP POLICY IF EXISTS "Teachers and admins can view all questions" ON vragen;
CREATE POLICY "Teachers and admins can view all questions" ON vragen
  FOR SELECT USING (
    -- Admin kan alles zien
    get_user_role(auth.uid()) = 'admin'
    OR
    -- Leerkracht kan vragen zien voor eigen niveaus
    niveau_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      WHERE k.teacher_id = auth.uid()
    )
    OR
    -- Student kan vragen zien voor ingeschreven niveaus
    niveau_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      JOIN inschrijvingen i ON k.id = i.class_id
      WHERE i.student_id = auth.uid()
    )
  );

-- VRAGEN: INSERT policy voor admin en leerkracht
DROP POLICY IF EXISTS "Teachers and admins can create questions" ON vragen;
CREATE POLICY "Teachers and admins can create questions" ON vragen
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Admin mag overal vragen aanmaken
      get_user_role(auth.uid()) = 'admin'
      OR
      -- Leerkracht mag vragen aanmaken voor eigen niveaus
      niveau_id IN (
        SELECT n.id FROM niveaus n
        JOIN klassen k ON n.class_id = k.id
        WHERE k.teacher_id = auth.uid()
      )
    )
  );

-- VRAGEN: UPDATE policy
DROP POLICY IF EXISTS "Teachers and admins can update questions" ON vragen;
CREATE POLICY "Teachers and admins can update questions" ON vragen
  FOR UPDATE USING (
    get_user_role(auth.uid()) = 'admin'
    OR niveau_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      WHERE k.teacher_id = auth.uid()
    )
  );

-- VRAGEN: DELETE policy
DROP POLICY IF EXISTS "Teachers and admins can delete questions" ON vragen;
CREATE POLICY "Teachers and admins can delete questions" ON vragen
  FOR DELETE USING (
    get_user_role(auth.uid()) = 'admin'
    OR niveau_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      WHERE k.teacher_id = auth.uid()
    )
  );

-- KLASSEN: SELECT policy voor admin
DROP POLICY IF EXISTS "Teachers can view their own classes" ON klassen;
DROP POLICY IF EXISTS "Admins and teachers can view classes" ON klassen;
CREATE POLICY "Admins and teachers can view classes" ON klassen
  FOR SELECT USING (
    -- Admin ziet alle klassen
    get_user_role(auth.uid()) = 'admin'
    OR
    -- Leerkracht ziet eigen klassen
    teacher_id = auth.uid()
    OR
    -- Student ziet ingeschreven klassen
    id IN (
      SELECT class_id FROM inschrijvingen
      WHERE student_id = auth.uid()
    )
  );

-- NIVEAUS: SELECT policy voor admin
DROP POLICY IF EXISTS "Users can view niveaus for their enrolled klassen" ON niveaus;
CREATE POLICY "Users can view niveaus for their enrolled klassen" ON niveaus
  FOR SELECT USING (
    -- Admin ziet alle niveaus
    get_user_role(auth.uid()) = 'admin'
    OR
    -- Leerkracht ziet niveaus van eigen klassen
    class_id IN (
      SELECT id FROM klassen WHERE teacher_id = auth.uid()
    )
    OR
    -- Student ziet niveaus van ingeschreven klassen
    class_id IN (
      SELECT class_id FROM inschrijvingen WHERE student_id = auth.uid()
    )
  );