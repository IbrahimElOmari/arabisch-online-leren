import { z } from 'zod';

// ============================================
// ANALYTICS SCHEMAS
// BI Dashboard & Metrics Validation
// ============================================

export const dateRangeSchema = z.object({
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
}).refine(data => new Date(data.start_date) <= new Date(data.end_date), {
  message: 'Startdatum moet voor einddatum zijn',
});

export const dashboardFiltersSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  module_id: z.string().uuid().optional(),
  niveau_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  role: z.enum(['leerling', 'leerkracht', 'admin']).optional(),
});

export const analyticsEventSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  session_id: z.string().optional().nullable(),
  event_type: z.string(),
  event_data: z.record(z.unknown()).optional().nullable(),
  page_url: z.string().optional().nullable(),
  created_at: z.string().datetime(),
});

export const learningAnalyticsSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  niveau_id: z.string().uuid(),
  module_id: z.string().uuid().optional().nullable(),
  total_points: z.number().int().default(0),
  questions_answered: z.number().int().default(0),
  correct_answers: z.number().int().default(0),
  accuracy_rate: z.number().min(0).max(1).default(0),
  weak_areas: z.array(z.string()).default([]),
  strong_areas: z.array(z.string()).default([]),
  last_updated: z.string().datetime(),
});

export const practiceSessionSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  niveau_id: z.string().uuid(),
  session_type: z.enum(['spaced_repetition', 'quiz', 'practice', 'review']),
  questions_total: z.number().int().min(0),
  questions_correct: z.number().int().min(0),
  duration_seconds: z.number().int().min(0).optional(),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional().nullable(),
});

export const financialMetricsSchema = z.object({
  total_revenue: z.number(),
  paying_students: z.number().int(),
  average_revenue_per_student: z.number(),
  conversion_rate: z.number().min(0).max(1),
  revenue_by_module: z.array(z.object({
    module_name: z.string(),
    total_revenue: z.number(),
  })),
  revenue_by_level: z.array(z.object({
    level_name: z.string(),
    total_revenue: z.number(),
  })),
  revenue_trend: z.array(z.object({
    date: z.string(),
    total_revenue: z.number(),
  })),
});

export const educationalMetricsSchema = z.object({
  total_students: z.number().int(),
  active_students: z.number().int(),
  avg_accuracy: z.number().min(0).max(1),
  completion_rate: z.number().min(0).max(1),
  avg_session_minutes: z.number(),
  student_progress: z.array(z.object({
    level_name: z.string(),
    student_count: z.number().int(),
    avg_points: z.number(),
  })),
  engagement_trend: z.array(z.object({
    date: z.string(),
    avg_session_minutes: z.number(),
    total_sessions: z.number().int(),
  })),
  weak_topics: z.array(z.object({
    topic: z.string(),
    student_count: z.number().int(),
  })),
  strong_topics: z.array(z.object({
    topic: z.string(),
    student_count: z.number().int(),
  })),
});

export const funnelMetricsSchema = z.object({
  registration: z.number().int(),
  first_login: z.number().int(),
  first_lesson: z.number().int(),
  first_completion: z.number().int(),
  active_users: z.number().int(),
  conversion_rates: z.object({
    registration_to_login: z.number().min(0).max(1),
    login_to_lesson: z.number().min(0).max(1),
    lesson_to_completion: z.number().min(0).max(1),
    completion_to_active: z.number().min(0).max(1),
  }),
});

export const exportRequestSchema = z.object({
  type: z.enum(['financial', 'educational', 'funnel']),
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  filters: dashboardFiltersSchema.optional(),
});

// Type exports
export type DateRange = z.infer<typeof dateRangeSchema>;
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type LearningAnalytics = z.infer<typeof learningAnalyticsSchema>;
export type PracticeSession = z.infer<typeof practiceSessionSchema>;
export type FinancialMetrics = z.infer<typeof financialMetricsSchema>;
export type EducationalMetrics = z.infer<typeof educationalMetricsSchema>;
export type FunnelMetrics = z.infer<typeof funnelMetricsSchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
