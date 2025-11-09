import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemHealthCheck {
  id: string;
  check_timestamp: string;
  check_type: 'api_health' | 'db_health' | 'edge_health' | 'storage_health';
  status: 'healthy' | 'degraded' | 'down';
  response_time_ms: number;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export const useSystemHealth = () => {
  const { data: healthChecks = [], isLoading, error } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_health_checks')
        .select('*')
        .order('check_timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as SystemHealthCheck[];
    },
    refetchInterval: 30000 // Refetch every 30s
  });

  // Calculate overall system status
  const latestChecks = healthChecks.slice(0, 4); // One per type
  const overallStatus = latestChecks.some(c => c.status === 'down')
    ? 'down'
    : latestChecks.some(c => c.status === 'degraded')
    ? 'degraded'
    : 'healthy';

  return {
    healthChecks,
    overallStatus,
    isLoading,
    error
  };
};
