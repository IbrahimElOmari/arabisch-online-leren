import { supabase } from '@/integrations/supabase/client';

/**
 * Question Service Layer
 * All question and answer-related database operations
 */

export async function fetchQuestionsByLevel(niveauId: string) {
  const { data, error } = await supabase
    .from('vragen')
    .select('*')
    .eq('niveau_id', niveauId)
    .order('volgorde', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function fetchQuestionById(questionId: string) {
  const { data, error } = await supabase
    .from('vragen')
    .select('*')
    .eq('id', questionId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createQuestion(questionData: {
  niveau_id: string;
  vraag_tekst: string;
  vraag_type: 'multiple_choice' | 'open_text' | 'audio_response';
  opties?: Record<string, unknown>;
  correct_antwoord?: Record<string, unknown>;
  audio_url?: string;
  video_url?: string;
  volgorde?: number;
}) {
  const { data, error } = await supabase
    .from('vragen')
    .insert([{
      niveau_id: questionData.niveau_id,
      vraag_tekst: questionData.vraag_tekst,
      vraag_type: questionData.vraag_type,
      opties: questionData.opties || null,
      correct_antwoord: questionData.correct_antwoord || null,
      audio_url: questionData.audio_url || null,
      video_url: questionData.video_url || null,
      volgorde: questionData.volgorde || 0,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateQuestion(questionId: string, updates: Partial<{
  vraag_tekst: string;
  opties: Record<string, unknown> | null;
  correct_antwoord: Record<string, unknown> | null;
  audio_url: string | null;
  video_url: string | null;
  volgorde: number;
}>) {
  const { data, error } = await supabase
    .from('vragen')
    .update(updates as any)
    .eq('id', questionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteQuestion(questionId: string) {
  const { error } = await supabase
    .from('vragen')
    .delete()
    .eq('id', questionId);
  
  if (error) throw error;
}

export async function fetchStudentAnswers(studentId: string, niveauId?: string) {
  let query = supabase
    .from('antwoorden')
    .select(`
      *,
      vragen(
        vraag_tekst,
        vraag_type,
        niveau_id,
        niveaus(naam)
      )
    `)
    .eq('student_id', studentId);

  if (niveauId) {
    query = query.eq('vragen.niveau_id', niveauId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function submitAnswer(answerData: {
  student_id: string;
  vraag_id: string;
  antwoord: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('antwoorden')
    .insert([answerData as any])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function gradeAnswer(answerId: string, gradeData: {
  is_correct?: boolean;
  punten: number;
  feedback?: string;
  beoordeeld_door: string;
}) {
  const { data, error } = await supabase
    .from('antwoorden')
    .update(gradeData)
    .eq('id', answerId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function autoGradeAnswer(answerId: string, studentAnswer: Record<string, unknown>) {
  // Fetch question with correct answer
  const { data: answer } = await supabase
    .from('antwoorden')
    .select('vraag_id, vragen(correct_antwoord, vraag_type)')
    .eq('id', answerId)
    .single();

  if (!answer || !answer.vragen) {
    throw new Error('Question not found');
  }

  const correctAnswer = answer.vragen.correct_antwoord;
  const questionType = answer.vragen.vraag_type;

  let isCorrect = false;
  let points = 0;

  if (questionType === 'multiple_choice') {
    isCorrect = JSON.stringify(studentAnswer) === JSON.stringify(correctAnswer);
    points = isCorrect ? 10 : 0;
  }

  const { data, error } = await supabase
    .from('antwoorden')
    .update({
      is_correct: isCorrect,
      punten: points
    })
    .eq('id', answerId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchUngradedAnswers(teacherId: string) {
  const { data, error } = await supabase
    .from('antwoorden')
    .select(`
      *,
      profiles!antwoorden_student_id_fkey(full_name, email),
      vragen!inner(
        vraag_tekst,
        vraag_type,
        niveaus!inner(
          naam,
          klassen!inner(
            teacher_id,
            name
          )
        )
      )
    `)
    .is('punten', null)
    .eq('vragen.niveaus.klassen.teacher_id', teacherId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}
