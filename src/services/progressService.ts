import { supabase } from '@/integrations/supabase/client';

/**
 * Progress Service Layer
 * All student progress-related database operations
 */

export async function fetchStudentProgress(studentId: string, niveauId?: string) {
  let query = supabase
    .from('student_niveau_progress')
    .select(`
      *,
      niveaus(
        naam,
        niveau_nummer,
        klassen(name)
      )
    `)
    .eq('student_id', studentId);

  if (niveauId) {
    query = query.eq('niveau_id', niveauId);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function fetchClassProgress(classId: string) {
  const { data, error } = await supabase
    .from('student_niveau_progress')
    .select(`
      *,
      profiles!student_niveau_progress_student_id_fkey(full_name, email),
      niveaus!inner(
        naam,
        niveau_nummer,
        class_id
      )
    `)
    .eq('niveaus.class_id', classId)
    .order('total_points', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateProgress(studentId: string, niveauId: string, points: number) {
  const { data: existing } = await supabase
    .from('student_niveau_progress')
    .select('id, total_points')
    .eq('student_id', studentId)
    .eq('niveau_id', niveauId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('student_niveau_progress')
      .update({
        total_points: existing.total_points + points,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('student_niveau_progress')
      .insert({
        student_id: studentId,
        niveau_id: niveauId,
        total_points: points
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export async function fetchBadges(studentId: string, niveauId?: string) {
  let query = supabase
    .from('awarded_badges')
    .select(`
      *,
      niveaus(naam, niveau_nummer)
    `)
    .eq('student_id', studentId);

  if (niveauId) {
    query = query.eq('niveau_id', niveauId);
  }

  const { data, error } = await query.order('awarded_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function awardBadge(badgeData: {
  student_id: string;
  niveau_id: string;
  badge_type: string;
  badge_id: string;
  badge_name: string;
  badge_description: string;
}) {
  const { data, error } = await supabase
    .from('awarded_badges')
    .insert(badgeData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchLeaderboard(classId: string, limit = 10) {
  const { data, error } = await supabase
    .from('student_niveau_progress')
    .select(`
      student_id,
      SUM(total_points) as total_points,
      profiles!student_niveau_progress_student_id_fkey(full_name),
      niveaus!inner(class_id)
    `)
    .eq('niveaus.class_id', classId)
    .order('total_points', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}
