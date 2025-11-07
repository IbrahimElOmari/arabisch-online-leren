// PR7: Admin types for metrics, feature flags, and audit logs

export interface SystemMetric {
  id: string;
  metric_timestamp: string;
  metric_type: 'api_latency' | 'error_rate' | 'db_connections' | 'cpu_load' | 'memory_usage' | 'uptime';
  metric_value: number;
  metric_unit: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface MetricsSummary {
  api_latency: {
    current: number;
    avg: number;
    p95: number;
    trend: 'up' | 'down' | 'stable';
  };
  error_rate: {
    current: number;
    avg: number;
    total_errors: number;
  };
  db_connections: {
    current: number;
    max: number;
    avg: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
}

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description?: string;
  is_enabled: boolean;
  rollout_percentage: number;
  target_roles: string[];
  target_user_ids: string[];
  metadata?: Record<string, unknown>;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFeatureFlagInput {
  flag_key: string;
  flag_name: string;
  description?: string;
  is_enabled?: boolean;
  rollout_percentage?: number;
  target_roles?: string[];
  target_user_ids?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateFeatureFlagInput {
  id: string;
  flag_name?: string;
  description?: string;
  is_enabled?: boolean;
  rollout_percentage?: number;
  target_roles?: string[];
  target_user_ids?: string[];
  metadata?: Record<string, unknown>;
}

export interface AdminActivity {
  id: string;
  admin_user_id: string;
  activity_type: 
    | 'user_role_change'
    | 'feature_flag_change'
    | 'content_moderation'
    | 'system_config_change'
    | 'bulk_operation'
    | 'security_action';
  target_entity_type: string;
  target_entity_id?: string;
  action_metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AdminActivityFilters {
  limit?: number;
  offset?: number;
  activity_type?: string;
  admin_user_id?: string;
  start_date?: string;
  end_date?: string;
}
