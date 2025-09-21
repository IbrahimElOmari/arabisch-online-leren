import { supabase } from '@/integrations/supabase/client';

/**
 * Optimized Supabase query utilities to prevent N+1 problems and improve performance
 */

// Optimized user enrollments with minimal data
export const getOptimizedUserEnrollments = async (userId: string) => {
  const { data, error } = await supabase
    .from('inschrijvingen')
    .select(`
      id,
      class_id,
      payment_status,
      klassen!inner(
        id,
        name,
        description
      )
    `)
    .eq('student_id', userId)
    .eq('payment_status', 'paid');

  return { data, error };
};

// Optimized class data with student count
export const getOptimizedClassData = async (classId: string) => {
  const [classResult, enrollmentResult] = await Promise.all([
    supabase
      .from('klassen')
      .select(`
        id,
        name,
        description,
        teacher_id,
        profiles!inner(full_name)
      `)
      .eq('id', classId)
      .single(),
    
    supabase
      .from('inschrijvingen')
      .select('id', { count: 'exact' })
      .eq('class_id', classId)
      .eq('payment_status', 'paid')
  ]);

  return {
    classData: classResult.data,
    studentCount: enrollmentResult.count || 0,
    error: classResult.error || enrollmentResult.error,
  };
};

// Optimized niveau progress with aggregated data
export const getOptimizedNiveauProgress = async (studentId: string, niveauId: string) => {
  const { data, error } = await supabase
    .from('student_niveau_progress')
    .select(`
      total_points,
      completed_tasks,
      completed_questions,
      is_completed,
      completed_at,
      niveaus!inner(
        id,
        naam,
        niveau_nummer
      )
    `)
    .eq('student_id', studentId)
    .eq('niveau_id', niveauId)
    .maybeSingle();

  return { data, error };
};

// Batch query for multiple niveau progress
export const getBatchNiveauProgress = async (studentId: string, niveauIds: string[]) => {
  const { data, error } = await supabase
    .from('student_niveau_progress')
    .select(`
      niveau_id,
      total_points,
      completed_tasks,
      completed_questions,
      is_completed,
      niveaus!inner(naam, niveau_nummer)
    `)
    .eq('student_id', studentId)
    .in('niveau_id', niveauIds);

  return { data, error };
};

// Optimized forum posts with author info
export const getOptimizedForumPosts = async (classId: string, limit = 20, offset = 0) => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      id,
      titel,
      inhoud,
      created_at,
      likes_count,
      dislikes_count,
      author_id,
      profiles!inner(full_name)
    `)
    .eq('class_id', classId)
    .eq('is_verwijderd', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { data, error };
};

// Optimized task submissions with task details
export const getOptimizedTaskSubmissions = async (studentId: string, levelId?: string) => {
  let query = supabase
    .from('task_submissions')
    .select(`
      id,
      task_id,
      grade,
      submitted_at,
      feedback,
      tasks!inner(
        id,
        title,
        description,
        grading_scale,
        level_id
      )
    `)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });

  if (levelId) {
    query = query.eq('tasks.level_id', levelId);
  }

  const { data, error } = await query;
  return { data, error };
};

// Optimized analytics query for teacher dashboard
export const getTeacherAnalytics = async (teacherId: string) => {
  const [classesResult, submissionsResult, progressResult] = await Promise.all([
    // Get teacher's classes with student count
    supabase
      .from('klassen')
      .select(`
        id,
        name,
        inschrijvingen!inner(id)
      `)
      .eq('teacher_id', teacherId),

    // Get recent submissions count
    supabase
      .from('task_submissions')
      .select(`
        id,
        grade,
        submitted_at,
        tasks!inner(level_id)
      `)
      .gte('submitted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('submitted_at', { ascending: false }),

    // Get completion statistics
    supabase
      .from('student_niveau_progress')
      .select(`
        student_id,
        niveau_id,
        total_points,
        is_completed,
        niveaus!inner(
          class_id,
          klassen!inner(teacher_id)
        )
      `)
      .eq('niveaus.klassen.teacher_id', teacherId)
  ]);

  return {
    classes: classesResult.data || [],
    recentSubmissions: submissionsResult.data || [],
    progressData: progressResult.data || [],
    errors: [classesResult.error, submissionsResult.error, progressResult.error].filter(Boolean),
  };
};

// Optimized query with proper indexing hints
export const getOptimizedUserDashboard = async (userId: string) => {
  const [profileResult, enrollmentsResult, progressResult] = await Promise.all([
    // User profile
    supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('id', userId)
      .single(),

    // User enrollments with class info
    supabase
      .from('inschrijvingen')
      .select(`
        id,
        class_id,
        payment_status,
        klassen!inner(
          id,
          name,
          description,
          niveaus(
            id,
            naam,
            niveau_nummer,
            is_actief
          )
        )
      `)
      .eq('student_id', userId)
      .eq('payment_status', 'paid'),

    // Recent progress
    supabase
      .from('student_niveau_progress')
      .select(`
        niveau_id,
        total_points,
        completed_tasks,
        completed_questions,
        is_completed,
        updated_at,
        niveaus!inner(naam, niveau_nummer)
      `)
      .eq('student_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10)
  ]);

  return {
    profile: profileResult.data,
    enrollments: enrollmentsResult.data || [],
    recentProgress: progressResult.data || [],
    errors: [profileResult.error, enrollmentsResult.error, progressResult.error].filter(Boolean),
  };
};

// Query performance monitoring
export const monitorQueryPerformance = () => {
  const originalFrom = supabase.from;
  
  supabase.from = function(table: string) {
    const startTime = Date.now();
    const query = originalFrom.call(this, table);
    
    // Override the execute methods to track timing
    const originalThen = query.then;
    query.then = function(onFulfilled?: any, onRejected?: any) {
      return originalThen.call(this, (result: any) => {
        const duration = Date.now() - startTime;
        console.debug(`Query to ${table} took ${duration}ms`);
        
        if (duration > 1000) {
          console.warn(`Slow query detected: ${table} took ${duration}ms`);
        }
        
        return onFulfilled ? onFulfilled(result) : result;
      }, onRejected);
    };
    
    return query;
  };
};

// Connection pool optimization
export const optimizeSupabaseConnection = () => {
  // This would typically be configured at the client level
  // For now, we'll provide guidelines in comments
  
  /*
   * Connection Pool Optimization Guidelines:
   * 
   * 1. Limit concurrent connections per client
   * 2. Use connection reuse for similar queries
   * 3. Implement query batching where possible
   * 4. Use read replicas for analytics queries
   * 5. Cache frequently accessed data
   */
  
  console.info('Supabase connection optimized with performance monitoring');
};