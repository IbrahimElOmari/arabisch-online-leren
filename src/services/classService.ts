import { supabase } from '@/integrations/supabase/client';

/**
 * Class Service Layer
 * All class-related database operations
 */

export async function fetchClasses() {
  const { data, error } = await supabase
    .from('klassen')
    .select(`
      *,
      profiles!klassen_teacher_id_fkey(full_name, email)
    `)
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function fetchClassById(classId: string) {
  const { data, error } = await supabase
    .from('klassen')
    .select(`
      *,
      profiles!klassen_teacher_id_fkey(full_name, email),
      niveaus(*)
    `)
    .eq('id', classId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchEnrolledClasses(studentId: string) {
  const { data, error } = await supabase
    .from('inschrijvingen')
    .select(`
      *,
      klassen(
        *,
        profiles!klassen_teacher_id_fkey(full_name, email)
      )
    `)
    .eq('student_id', studentId)
    .eq('payment_status', 'paid');
  
  if (error) throw error;
  return data;
}

export async function fetchTeacherClasses(teacherId: string) {
  const { data, error } = await supabase
    .from('klassen')
    .select(`
      *,
      niveaus(count)
    `)
    .eq('teacher_id', teacherId)
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function createClass(classData: {
  name: string;
  description?: string;
  teacher_id: string;
}) {
  const { data, error } = await supabase
    .from('klassen')
    .insert(classData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateClass(classId: string, updates: {
  name?: string;
  description?: string;
  teacher_id?: string;
}) {
  const { data, error } = await supabase
    .from('klassen')
    .update(updates)
    .eq('id', classId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteClass(classId: string) {
  const { error } = await supabase
    .from('klassen')
    .delete()
    .eq('id', classId);
  
  if (error) throw error;
}

export async function enrollStudent(studentId: string, classId: string) {
  const { data, error } = await supabase
    .from('inschrijvingen')
    .insert({
      student_id: studentId,
      class_id: classId,
      payment_status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateEnrollmentPayment(enrollmentId: string, status: 'pending' | 'paid' | 'failed') {
  const { data, error } = await supabase
    .from('inschrijvingen')
    .update({ payment_status: status })
    .eq('id', enrollmentId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchClassStudents(classId: string) {
  const { data, error } = await supabase
    .from('inschrijvingen')
    .select(`
      *,
      profiles!inschrijvingen_student_id_fkey(id, full_name, email, role)
    `)
    .eq('class_id', classId)
    .eq('payment_status', 'paid');
  
  if (error) throw error;
  return data;
}
