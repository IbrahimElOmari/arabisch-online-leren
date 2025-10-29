/**
 * Type definitions for Teacher Tools (F3)
 */

export interface TeacherAnalyticsCache {
  id: string;
  teacher_id: string;
  class_id: string | null;
  metric_type: string;
  metric_data: Record<string, any>;
  calculated_at: string;
  valid_until: string | null;
}

export interface GradingRubric {
  id: string;
  rubric_name: string;
  rubric_type: 'assignment' | 'participation' | 'project' | null;
  criteria: Record<string, any>;
  total_points: number;
  created_by: string | null;
  is_template: boolean;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  template_name: string;
  template_category: 'announcement' | 'feedback' | 'reminder' | null;
  template_content: string;
  created_by: string | null;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
}

export interface ScheduledMessage {
  id: string;
  sender_id: string;
  recipient_type: 'class' | 'student' | 'parents' | null;
  recipient_ids: string[];
  message_content: string;
  scheduled_for: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
}

export interface TeacherReward {
  id: string;
  teacher_id: string;
  student_id: string;
  reward_type: 'points' | 'badge' | 'coins' | null;
  reward_value: number;
  reason: string | null;
  awarded_at: string;
}
