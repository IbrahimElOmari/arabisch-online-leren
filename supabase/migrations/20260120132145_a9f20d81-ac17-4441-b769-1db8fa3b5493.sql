-- =====================================================
-- TESTMODUS: Verwijder payment_status = 'paid' voorwaarde
-- Dit maakt het systeem testbaar zonder betalingsgating
-- REVERT DIT VOOR PRODUCTIE!
-- =====================================================

-- 1. VRAGEN: Students kunnen vragen zien als ze ingeschreven zijn (zonder payment check)
DROP POLICY IF EXISTS "Students can view vragen for enrolled niveaus" ON vragen;
CREATE POLICY "Students can view vragen for enrolled niveaus" ON vragen
  FOR SELECT USING (
    niveau_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      JOIN inschrijvingen i ON k.id = i.class_id
      WHERE i.student_id = auth.uid()
      -- TESTMODUS: payment_status check verwijderd
    )
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'leerkracht')
    )
  );

-- 2. ANTWOORDEN: Students kunnen hun eigen antwoorden indienen
DROP POLICY IF EXISTS "Students can insert their own answers" ON antwoorden;
CREATE POLICY "Students can insert their own answers" ON antwoorden
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND vraag_id IN (
      SELECT v.id FROM vragen v
      JOIN niveaus n ON v.niveau_id = n.id
      JOIN klassen k ON n.class_id = k.id
      JOIN inschrijvingen i ON k.id = i.class_id
      WHERE i.student_id = auth.uid()
      -- TESTMODUS: payment_status check verwijderd
    )
  );

-- 3. ANTWOORDEN: Students kunnen hun eigen antwoorden zien
DROP POLICY IF EXISTS "Students can view own answers" ON antwoorden;
CREATE POLICY "Students can view own answers" ON antwoorden
  FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'leerkracht')
    )
  );

-- 4. TASKS: Students kunnen taken zien als ze ingeschreven zijn
DROP POLICY IF EXISTS "Users can view tasks for their levels" ON tasks;
CREATE POLICY "Users can view tasks for their levels" ON tasks
  FOR SELECT USING (
    level_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      JOIN inschrijvingen i ON k.id = i.class_id
      WHERE i.student_id = auth.uid()
      -- TESTMODUS: payment_status check verwijderd
    )
    OR level_id IN (
      SELECT n.id FROM niveaus n
      JOIN klassen k ON n.class_id = k.id
      WHERE k.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- 5. TASK_SUBMISSIONS: Students kunnen hun eigen inzendingen zien
DROP POLICY IF EXISTS "Students can view own submissions" ON task_submissions;
CREATE POLICY "Students can view own submissions" ON task_submissions
  FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'leerkracht')
    )
  );

-- 6. TASK_SUBMISSIONS: Students kunnen inzendingen doen voor taken waar ze toegang toe hebben
DROP POLICY IF EXISTS "Students can submit to enrolled tasks" ON task_submissions;
CREATE POLICY "Students can submit to enrolled tasks" ON task_submissions
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND task_id IN (
      SELECT t.id FROM tasks t
      JOIN niveaus n ON t.level_id = n.id
      JOIN klassen k ON n.class_id = k.id
      JOIN inschrijvingen i ON k.id = i.class_id
      WHERE i.student_id = auth.uid()
      -- TESTMODUS: payment_status check verwijderd
    )
  );

-- 7. NIVEAUS: Students kunnen niveaus zien als ze ingeschreven zijn
DROP POLICY IF EXISTS "Users can view niveaus for their enrolled klassen" ON niveaus;
CREATE POLICY "Users can view niveaus for their enrolled klassen" ON niveaus
  FOR SELECT USING (
    class_id IN (
      SELECT i.class_id FROM inschrijvingen i
      WHERE i.student_id = auth.uid()
      -- TESTMODUS: payment_status check verwijderd
    )
    OR class_id IN (
      SELECT k.id FROM klassen k
      WHERE k.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );