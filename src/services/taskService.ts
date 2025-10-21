import { supabase } from '@/integrations/supabase/client';

/**
 * Task Service Layer
 * All task and submission-related database operations
 */

export async function fetchTasksByLevel(levelId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      profiles!tasks_author_id_fkey(full_name)
    `)
    .eq('level_id', levelId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function fetchTaskById(taskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      profiles!tasks_author_id_fkey(full_name),
      niveaus(naam, class_id)
    `)
    .eq('id', taskId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createTask(taskData: {
  level_id: string;
  author_id: string;
  title: string;
  description?: string;
  required_submission_type: 'text' | 'file' | 'both';
  grading_scale: number;
  status?: 'draft' | 'published';
}) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData as any])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, updates: Partial<{
  title: string;
  description: string;
  status: 'draft' | 'published';
  media_url: string;
  media_type: string;
  youtube_url: string;
}>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  
  if (error) throw error;
}

export async function fetchTaskSubmissions(taskId: string) {
  const { data, error } = await supabase
    .from('task_submissions')
    .select(`
      *,
      profiles!task_submissions_student_id_fkey(full_name, email)
    `)
    .eq('task_id', taskId)
    .order('submitted_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function fetchStudentSubmissions(studentId: string, levelId?: string) {
  let query = supabase
    .from('task_submissions')
    .select(`
      *,
      tasks(
        title,
        level_id,
        grading_scale,
        niveaus(naam)
      )
    `)
    .eq('student_id', studentId);

  if (levelId) {
    query = query.eq('tasks.level_id', levelId);
  }

  const { data, error } = await query.order('submitted_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createSubmission(submissionData: {
  task_id: string;
  student_id: string;
  submission_content?: string;
  submission_file_path?: string;
}) {
  const { data, error } = await supabase
    .from('task_submissions')
    .insert(submissionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function gradeSubmission(submissionId: string, gradeData: {
  grade: number;
  feedback?: string;
}) {
  const { data, error } = await supabase
    .from('task_submissions')
    .update(gradeData)
    .eq('id', submissionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchPendingSubmissions(teacherId: string) {
  const { data, error } = await supabase
    .from('task_submissions')
    .select(`
      *,
      profiles!task_submissions_student_id_fkey(full_name, email),
      tasks!inner(
        title,
        level_id,
        grading_scale,
        niveaus!inner(
          naam,
          klassen!inner(
            teacher_id,
            name
          )
        )
      )
    `)
    .is('grade', null)
    .eq('tasks.niveaus.klassen.teacher_id', teacherId)
    .order('submitted_at', { ascending: true });
  
  if (error) throw error;
  return data;
}
