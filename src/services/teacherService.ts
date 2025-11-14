import { supabase } from '@/integrations/supabase/client';
import type { TeacherAnalyticsCache, GradingRubric, MessageTemplate, ScheduledMessage, TeacherReward } from '@/types/teacher';

/**
 * Teacher Service Layer
 * All teacher-related database operations
 */

export async function fetchTeacherClasses(teacherId: string) {
  const { data, error } = await supabase
    .from('klassen')
    .select(`
      *,
      niveaus(id, naam, order_index),
      inschrijvingen(count)
    `)
    .eq('teacher_id', teacherId)
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function fetchClassStudents(classId: string) {
  const { data, error } = await supabase
    .from('inschrijvingen')
    .select(`
      *,
      profiles!inschrijvingen_student_id_fkey(
        id,
        full_name,
        email,
        role,
        created_at
      )
    `)
    .eq('class_id', classId)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function fetchStudentProgress(studentId: string) {
  const { data, error } = await supabase
    .from('student_niveau_progress')
    .select(`
      *,
      niveaus(id, naam, class_id)
    `)
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function fetchStudentSubmissions(studentId: string, levelId?: string) {
  let query = supabase
    .from('task_submissions')
    .select(`
      *,
      tasks(id, title, grading_scale, level_id)
    `)
    .eq('student_id', studentId);

  if (levelId) {
    query = query.eq('tasks.level_id', levelId);
  }

  const { data, error } = await query.order('submitted_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createTeacherNote(noteData: {
  studentId: string;
  content: string;
  isFlagged?: boolean;
}) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('teacher_notes')
    .insert({
      teacher_id: user.id,
      student_id: noteData.studentId,
      content: noteData.content,
      is_flagged: noteData.isFlagged || false,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchTeacherNotes(studentId: string) {
  const { data, error } = await supabase
    .from('teacher_notes')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateTeacherNote(noteId: string, updates: {
  content?: string;
  isFlagged?: boolean;
}) {
  const { data, error } = await supabase
    .from('teacher_notes')
    .update({
      content: updates.content,
      is_flagged: updates.isFlagged,
    })
    .eq('id', noteId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteTeacherNote(noteId: string) {
  const { error } = await supabase
    .from('teacher_notes')
    .delete()
    .eq('id', noteId);
  
  if (error) throw error;
}

export async function awardManualXP(data: {
  studentId: string;
  amount: number;
  reason: string;
  rewardType?: 'points' | 'badge' | 'coins';
}) {
  const { data: result, error } = await supabase.functions.invoke('award-manual-xp', {
    body: data,
  });

  if (error) throw error;
  return result;
}

export async function fetchStudentStats(studentId: string) {
  const { data, error } = await supabase.functions.invoke('fetch-student-stats', {
    body: { studentId },
  });

  if (error) throw error;
  return data.stats;
}

export async function assignTask(taskData: {
  levelId: string;
  title: string;
  description?: string;
  dueDate?: string;
  requiredSubmissionType: 'text' | 'file' | 'both';
  gradingScale: number;
}) {
  const { data, error } = await supabase.functions.invoke('assign-task', {
    body: taskData,
  });

  if (error) throw error;
  return data.task;
}

export async function fetchGradingRubrics(teacherId?: string) {
  let query = supabase
    .from('grading_rubrics')
    .select('*')
    .order('created_at', { ascending: false });

  if (teacherId) {
    query = query.or(`created_by.eq.${teacherId},is_template.eq.true`);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function createGradingRubric(rubricData: {
  rubricName: string;
  rubricType: 'assignment' | 'participation' | 'project';
  criteria: Record<string, any>;
  totalPoints: number;
  isTemplate?: boolean;
}) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('grading_rubrics')
    .insert({
      rubric_name: rubricData.rubricName,
      rubric_type: rubricData.rubricType,
      criteria: rubricData.criteria,
      total_points: rubricData.totalPoints,
      created_by: user.id,
      is_template: rubricData.isTemplate || false,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchMessageTemplates(teacherId?: string) {
  let query = supabase
    .from('message_templates')
    .select('*')
    .order('usage_count', { ascending: false });

  if (teacherId) {
    query = query.or(`created_by.eq.${teacherId},is_shared.eq.true`);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function fetchTeacherRewards(studentId: string) {
  const { data, error } = await supabase
    .from('teacher_rewards')
    .select(`
      *,
      profiles!teacher_rewards_teacher_id_fkey(full_name)
    `)
    .eq('student_id', studentId)
    .order('awarded_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
