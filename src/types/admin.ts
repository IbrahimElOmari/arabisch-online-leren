/**
 * Type definitions for Admin Tools (F7)
 */

export interface SystemMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string | null;
  recorded_at: string;
}

export interface FeatureFlag {
  id: string;
  flag_name: string;
  flag_description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_roles: string[];
  updated_by: string | null;
  updated_at: string;
}

export interface UserReport {
  id: string;
  reported_user_id: string | null;
  reported_by: string | null;
  report_type: string;
  report_reason: string;
  evidence_urls: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution: string | null;
  created_at: string;
}

export interface SystemAnnouncement {
  id: string;
  announcement_title: string;
  announcement_content: string;
  announcement_type: 'info' | 'warning' | 'maintenance' | null;
  target_roles: string[];
  is_active: boolean;
  display_from: string;
  display_until: string | null;
  created_by: string | null;
  created_at: string;
}
