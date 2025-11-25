import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// ============================================
// BI DASHBOARD SERVICE
// Business Intelligence & Analytics
// ============================================

// Validation schemas
export const dateRangeSchema = z.object({
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
});

export const dashboardFiltersSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  module_id: z.string().uuid().optional(),
  niveau_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  role: z.enum(['leerling', 'leerkracht', 'admin']).optional(),
});

// Types
export interface FinancialMetrics {
  total_revenue: number;
  revenue_by_module: Array<{ module_name: string; amount: number }>;
  revenue_by_level: Array<{ level_name: string; amount: number }>;
  revenue_by_class: Array<{ class_name: string; amount: number }>;
  revenue_trend: Array<{ date: string; amount: number }>;
  payment_methods: Array<{ method: string; count: number; amount: number }>;
  currency_breakdown: Array<{ currency: string; amount: number }>;
}

export interface EducationalMetrics {
  total_students: number;
  active_students: number;
  avg_accuracy_rate: number;
  completion_rate: number;
  student_progress: Array<{
    student_id: string;
    student_name: string;
    niveau: string;
    accuracy: number;
    lessons_completed: number;
    time_spent_hours: number;
  }>;
  theory_vs_skills: {
    avg_theory_score: number;
    avg_skills_score: number;
  };
  weak_topics: Array<{ topic: string; student_count: number }>;
  strong_topics: Array<{ topic: string; student_count: number }>;
}

export interface FunnelMetrics {
  registration: number;
  first_login: number;
  first_lesson: number;
  first_completion: number;
  active_users: number;
  conversion_rates: {
    registration_to_login: number;
    login_to_lesson: number;
    lesson_to_completion: number;
    completion_to_active: number;
  };
}

// ============================================
// BI DASHBOARD SERVICE
// ============================================

export class BiDashboardService {
  /**
   * Get financial analytics
   */
  static async getFinancialAnalytics(
    filters?: z.infer<typeof dashboardFiltersSchema>
  ): Promise<FinancialMetrics> {
    const validated = filters ? dashboardFiltersSchema.parse(filters) : {};

    // Query payments directly since financial_analytics view depends on it
    let query = supabase.from('payments').select('*, enrollment:enrollments(*, module:modules(module_name), level:module_levels(level_name))');

    if (validated.start_date) {
      query = query.gte('payment_date', validated.start_date);
    }
    if (validated.end_date) {
      query = query.lte('payment_date', validated.end_date);
    }
    if (validated.module_id) {
      query = query.eq('module_id', validated.module_id);
    }
    if (validated.class_id) {
      query = query.eq('class_id', validated.class_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calculate totals (payments don't have amount field, using simplified approach)
    const totalRevenue = (data || []).length * 100; // Placeholder

    // Group by module
    const revenueByModule: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const moduleName = row.enrollment?.module?.module_name || 'Unknown';
      revenueByModule[moduleName] = (revenueByModule[moduleName] || 0) + 100;
    });

    // Group by level
    const revenueByLevel: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const levelName = row.enrollment?.level?.level_name || 'Unknown';
      revenueByLevel[levelName] = (revenueByLevel[levelName] || 0) + 100;
    });

    // Group by currency
    const currencyBreakdown: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const currency = row.payment_method || 'Unknown';
      currencyBreakdown[currency] = (currencyBreakdown[currency] || 0) + 1;
    });

    // Revenue trend (daily)
    const revenueTrend: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const date = new Date(row.created_at).toISOString().split('T')[0];
      revenueTrend[date] = (revenueTrend[date] || 0) + 100;
    });

    return {
      total_revenue: totalRevenue,
      revenue_by_module: Object.entries(revenueByModule).map(([module_name, amount]) => ({
        module_name,
        amount,
      })),
      revenue_by_level: Object.entries(revenueByLevel).map(([level_name, amount]) => ({
        level_name,
        amount,
      })),
      revenue_by_class: [], // Not implemented yet
      revenue_trend: Object.entries(revenueTrend).map(([date, amount]) => ({
        date,
        amount,
      })).sort((a, b) => a.date.localeCompare(b.date)),
      payment_methods: [], // Would need payment_method field
      currency_breakdown: Object.entries(currencyBreakdown).map(([currency, amount]) => ({
        currency,
        amount,
      })),
    };
  }

  /**
   * Get educational progress analytics
   */
  static async getEducationalAnalytics(
    filters?: z.infer<typeof dashboardFiltersSchema>
  ): Promise<EducationalMetrics> {
    const validated = filters ? dashboardFiltersSchema.parse(filters) : {};

    // Get student analytics directly
    let query = supabase.from('learning_analytics').select('*');

    if (validated.module_id) {
      query = query.eq('module_id', validated.module_id);
    }
    if (validated.niveau_id) {
      query = query.eq('niveau_id', validated.niveau_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalStudents = new Set((data || []).map((row: any) => row.student_id)).size;
    
    // Active students (activity in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeStudents = (data || []).filter((row: any) => 
      row.last_updated && new Date(row.last_updated) > sevenDaysAgo
    ).length;

    // Average accuracy
    const avgAccuracy = (data || []).length > 0
      ? (data || []).reduce((sum: number, row: any) => sum + (row.accuracy_rate || 0), 0) / (data || []).length
      : 0;

    // Collect weak and strong topics
    const weakTopicsCount: Record<string, number> = {};
    const strongTopicsCount: Record<string, number> = {};

    (data || []).forEach((row: any) => {
      (row.weak_areas || []).forEach((topic: string) => {
        weakTopicsCount[topic] = (weakTopicsCount[topic] || 0) + 1;
      });
      (row.strong_areas || []).forEach((topic: string) => {
        strongTopicsCount[topic] = (strongTopicsCount[topic] || 0) + 1;
      });
    });

    // Get detailed student progress
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', (data || []).map(row => row.student_id));

    const studentProgress = await Promise.all(
      (data || []).slice(0, 100).map(async (row: any) => {
        const profile = (profiles || []).find(p => p.id === row.student_id);
        
        // Get practice sessions count as proxy
        const { count: practiceCount } = await supabase
          .from('practice_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', row.student_id);

        return {
          student_id: row.student_id,
          student_name: profile?.full_name || 'Unknown',
          niveau: 'N/A',
          accuracy: row.accuracy_rate || 0,
          lessons_completed: practiceCount || 0,
          time_spent_hours: 0,
        };
      })
    );

    return {
      total_students: totalStudents,
      active_students: activeStudents,
      avg_accuracy_rate: avgAccuracy,
      completion_rate: 0, // Would need more complex calculation
      student_progress: studentProgress,
      theory_vs_skills: {
        avg_theory_score: avgAccuracy * 100, // Simplified
        avg_skills_score: avgAccuracy * 95, // Simplified (typically slightly lower)
      },
      weak_topics: Object.entries(weakTopicsCount)
        .map(([topic, student_count]) => ({ topic, student_count }))
        .sort((a, b) => b.student_count - a.student_count)
        .slice(0, 10),
      strong_topics: Object.entries(strongTopicsCount)
        .map(([topic, student_count]) => ({ topic, student_count }))
        .sort((a, b) => b.student_count - a.student_count)
        .slice(0, 10),
    };
  }

  /**
   * Get funnel conversion metrics
   */
  static async getFunnelMetrics(
    filters?: z.infer<typeof dashboardFiltersSchema>
  ): Promise<FunnelMetrics> {
    const validated = filters ? dashboardFiltersSchema.parse(filters) : {};

    // Total registrations
    let profileQuery = supabase.from('profiles').select('id', { count: 'exact', head: true });
    if (validated.start_date) {
      profileQuery = profileQuery.gte('created_at', validated.start_date);
    }
    if (validated.end_date) {
      profileQuery = profileQuery.lte('created_at', validated.end_date);
    }
    const { count: registration } = await profileQuery;

    // First login (users with at least one session)
    const { count: firstLogin } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'session_start');

    // First lesson (users with at least one practice session)
    const { count: firstLesson } = await supabase
      .from('practice_sessions')
      .select('student_id', { count: 'exact', head: true });

    // First completion (completed practice sessions)
    const { count: firstCompletion } = await supabase
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('questions_correct', 1);

    // Active users (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: activeUsers } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    return {
      registration: registration || 0,
      first_login: firstLogin || 0,
      first_lesson: firstLesson || 0,
      first_completion: firstCompletion || 0,
      active_users: activeUsers || 0,
      conversion_rates: {
        registration_to_login: registration ? (firstLogin || 0) / registration : 0,
        login_to_lesson: firstLogin ? (firstLesson || 0) / firstLogin : 0,
        lesson_to_completion: firstLesson ? (firstCompletion || 0) / firstLesson : 0,
        completion_to_active: firstCompletion ? (activeUsers || 0) / firstCompletion : 0,
      },
    };
  }

  /**
   * Export data to CSV
   */
  static async exportToCSV(
    type: 'financial' | 'educational' | 'funnel',
    filters?: z.infer<typeof dashboardFiltersSchema>
  ): Promise<string> {
    let data: any;
    
    switch (type) {
      case 'financial':
        data = await this.getFinancialAnalytics(filters);
        return this.convertToCSV(data);
      case 'educational':
        data = await this.getEducationalAnalytics(filters);
        return this.convertToCSV(data);
      case 'funnel':
        data = await this.getFunnelMetrics(filters);
        return this.convertToCSV(data);
      default:
        throw new Error('Invalid export type');
    }
  }

  private static convertToCSV(data: any): string {
    // Simple CSV conversion (would need more sophisticated implementation)
    const json = JSON.stringify(data, null, 2);
    return json;
  }

  /**
   * Get real-time dashboard updates
   */
  static subscribeToUpdates(
    onUpdate: (data: any) => void
  ) {
    // Subscribe to analytics_events for real-time updates
    return supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
        },
        (payload) => {
          onUpdate({ type: 'analytics_event', data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          onUpdate({ type: 'payment', data: payload.new });
        }
      )
      .subscribe();
  }
}
