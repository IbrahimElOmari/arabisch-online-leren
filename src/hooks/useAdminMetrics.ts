import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MetricsSummary } from '@/types/admin';

export const useAdminMetrics = (period: '1h' | '24h' | '7d' = '24h') => {
  return useQuery({
    queryKey: ['admin-metrics', period],
    queryFn: async (): Promise<MetricsSummary> => {
      const { data, error } = await supabase.functions.invoke('admin-metrics-get', {
        body: { period }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch metrics');
      }

      return data.metrics || {};
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000,
  });
};
