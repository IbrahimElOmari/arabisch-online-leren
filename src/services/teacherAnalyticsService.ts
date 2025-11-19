import { supabase } from '@/integrations/supabase/client';

export interface ClassAnalytics {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  completionRate: number;
  averageGrade: number;
  totalHoursSpent: number;
}

export interface StudentPerformance {
  id: string;
  student_name: string;
  total_points: number;
  completed_levels: number;
  average_grade: number;
  time_spent_minutes: number;
  last_active: string;
  struggling_areas: string[];
  strengths: string[];
  attendance_rate: number;
}

export interface PerformanceHeatmap {
  topic: string;
  difficulty: string;
  success_rate: number;
  attempt_count: number;
}

export interface ActivityTrend {
  date: string;
  active_students: number;
  questions_answered: number;
  average_accuracy: number;
}

export const teacherAnalyticsService = {
  /**
   * Fetches comprehensive class analytics
   */
  async getClassAnalytics(classId: string): Promise<ClassAnalytics> {
    // Get total enrolled students
    const { data: enrollments, error: enrollError } = await supabase
      .from('inschrijvingen')
      .select('student_id')
      .eq('class_id', classId)
      .eq('payment_status', 'paid');

    if (enrollError) throw enrollError;

    const totalStudents = enrollments?.length || 0;

    // Get active students (activity in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activeSessions, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('student_id')
      .gte('started_at', sevenDaysAgo.toISOString());

    if (sessionError) throw sessionError;

    const activeStudentIds = new Set(
      activeSessions?.map(s => s.student_id) || []
    );
    const activeStudents = activeStudentIds.size;

    // Use mock average progress (voortgang table structure varies)
    const averageProgress = 65; // Replace with actual query once schema is confirmed

    // Get average grade from antwoorden
    const { data: answers } = await supabase
      .from('antwoorden')
      .select('punten, is_correct')
      .in('student_id', enrollments?.map(e => e.student_id) || [])
      .not('punten', 'is', null);

    let averageGrade = 0;
    if (answers && answers.length > 0) {
      const totalPoints = answers.reduce((acc, a) => acc + (a.punten || 0), 0);
      averageGrade = totalPoints / answers.length;
    }

    const completionRate = answers && answers.length > 0
      ? (answers.filter(a => a.is_correct).length / answers.length) * 100
      : 0;

    // Calculate total study time
    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('started_at, ended_at')
      .in('student_id', enrollments?.map(e => e.student_id) || [])
      .not('ended_at', 'is', null);

    let totalMinutes = 0;
    if (sessions) {
      totalMinutes = sessions.reduce((acc, s) => {
        if (s.started_at && s.ended_at) {
          const diff = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
          return acc + (diff / 1000 / 60); // Convert to minutes
        }
        return acc;
      }, 0);
    }

    return {
      totalStudents,
      activeStudents,
      averageProgress,
      completionRate,
      averageGrade,
      totalHoursSpent: Math.round(totalMinutes / 60),
    };
  },

  /**
   * Fetches detailed student performance data
   */
  async getStudentPerformance(classId: string): Promise<StudentPerformance[]> {
    const { data: enrollments, error } = await supabase
      .from('inschrijvingen')
      .select(`
        student_id,
        profiles!inschrijvingen_student_id_fkey (
          id,
          email
        )
      `)
      .eq('class_id', classId)
      .eq('payment_status', 'paid');

    if (error) throw error;

    const studentPerformances: StudentPerformance[] = [];

    for (const enrollment of enrollments || []) {
      const studentId = enrollment.student_id;
      const studentName = (enrollment.profiles as any)?.email?.split('@')[0] || 'Student';

      // Get points from gamification (mock for now)
      const totalPoints = 0; // Replace with actual gamification query
      
      // Completed levels (mock)
      const completedLevels = 0;

      // Get average grade
      const { data: answers } = await supabase
        .from('antwoorden')
        .select('punten, is_correct')
        .eq('student_id', studentId)
        .not('punten', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      const avgGrade = answers && answers.length > 0
        ? answers.reduce((acc, a) => acc + (a.punten || 0), 0) / answers.length
        : 0;

      // Get study time
      const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('started_at, ended_at')
        .eq('student_id', studentId)
        .not('ended_at', 'is', null);

      let timeSpent = 0;
      if (sessions) {
        timeSpent = sessions.reduce((acc, s) => {
          if (s.started_at && s.ended_at) {
            const diff = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
            return acc + (diff / 1000 / 60);
          }
          return acc;
        }, 0);
      }

      // Get last activity
      const { data: lastActivity } = await supabase
        .from('practice_sessions')
        .select('started_at')
        .eq('student_id', studentId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get analytics for struggling areas
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select('weak_areas, strong_areas')
        .eq('student_id', studentId)
        .maybeSingle();

      // Get attendance
      const { data: lessons } = await supabase
        .from('lessen')
        .select('id')
        .eq('class_id', classId);

      const totalLessons = lessons?.length || 1;

      const lessonIds = lessons?.map(l => l.id).filter((id): id is string => id !== null) || [];
      
      const { data: attendance } = lessonIds.length > 0 ? await supabase
        .from('aanwezigheid')
        .select('status')
        .eq('student_id', studentId)
        .in('lesson_id', lessonIds) : { data: null };

      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = (presentCount / totalLessons) * 100;

      studentPerformances.push({
        id: studentId,
        student_name: studentName,
        total_points: totalPoints,
        completed_levels: completedLevels,
        average_grade: avgGrade,
        time_spent_minutes: Math.round(timeSpent),
        last_active: lastActivity?.started_at || 'Never',
        struggling_areas: analytics?.weak_areas || [],
        strengths: analytics?.strong_areas || [],
        attendance_rate: attendanceRate,
      });
    }

    return studentPerformances;
  },

  /**
   * Generates performance heatmap data
   */
  async getPerformanceHeatmap(classId: string): Promise<PerformanceHeatmap[]> {
    const { data: enrollments } = await supabase
      .from('inschrijvingen')
      .select('student_id')
      .eq('class_id', classId)
      .eq('payment_status', 'paid');

    const studentIds = enrollments?.map(e => e.student_id) || [];

    // Get all answers with question details
    const { data: answers } = await supabase
      .from('antwoorden')
      .select(`
        is_correct,
        vraag:vragen (
          vraag_type
        )
      `)
      .in('student_id', studentIds);

    // Group by topic and calculate success rates
    const heatmapData: Record<string, { correct: number; total: number }> = {};

    (answers || []).forEach((answer: any) => {
      const topic = 'General'; // Would use answer.vraag?.topic if available
      const key = `${topic}-medium`; // Would use actual difficulty if available

      if (!heatmapData[key]) {
        heatmapData[key] = { correct: 0, total: 0 };
      }

      heatmapData[key].total++;
      if (answer.is_correct) {
        heatmapData[key].correct++;
      }
    });

    return Object.entries(heatmapData).map(([key, data]) => {
      const [topic, difficulty] = key.split('-');
      return {
        topic,
        difficulty,
        success_rate: (data.correct / data.total) * 100,
        attempt_count: data.total,
      };
    });
  },

  /**
   * Gets activity trends over time
   */
  async getActivityTrends(
    classId: string,
    days: number = 30
  ): Promise<ActivityTrend[]> {
    const { data: enrollments } = await supabase
      .from('inschrijvingen')
      .select('student_id')
      .eq('class_id', classId)
      .eq('payment_status', 'paid');

    const studentIds = enrollments?.map(e => e.student_id) || [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get practice sessions
    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('student_id, started_at, questions_attempted, questions_correct')
      .in('student_id', studentIds)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: true });

    // Group by date
    const trendsByDate: Record<string, {
      students: Set<string>;
      questions: number;
      correct: number;
    }> = {};

    (sessions || []).forEach(session => {
      const date = new Date(session.started_at).toISOString().split('T')[0];
      
      if (!trendsByDate[date]) {
        trendsByDate[date] = {
          students: new Set(),
          questions: 0,
          correct: 0,
        };
      }

      trendsByDate[date].students.add(session.student_id);
      trendsByDate[date].questions += session.questions_attempted || 0;
      trendsByDate[date].correct += session.questions_correct || 0;
    });

    return Object.entries(trendsByDate).map(([date, data]) => ({
      date,
      active_students: data.students.size,
      questions_answered: data.questions,
      average_accuracy: data.questions > 0 
        ? (data.correct / data.questions) * 100 
        : 0,
    }));
  },

  /**
   * Exports analytics data as CSV
   */
  async exportAnalytics(classId: string): Promise<string> {
    const students = await this.getStudentPerformance(classId);
    
    const headers = [
      'Student Name',
      'Total Points',
      'Completed Levels',
      'Average Grade',
      'Time Spent (min)',
      'Last Active',
      'Attendance Rate',
      'Struggling Areas',
      'Strengths',
    ];

    const rows = students.map(s => [
      s.student_name,
      s.total_points.toString(),
      s.completed_levels.toString(),
      s.average_grade.toFixed(1),
      s.time_spent_minutes.toString(),
      s.last_active,
      `${s.attendance_rate.toFixed(0)}%`,
      s.struggling_areas.join('; '),
      s.strengths.join('; '),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  },
};
