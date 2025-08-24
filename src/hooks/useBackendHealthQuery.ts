
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

type HealthStatus = 'ok' | 'degraded' | 'down';

const checkBackendHealth = async (): Promise<HealthStatus> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000); // 2s timeout

  try {
    const { error } = await supabase
      .from('profiles')
      .select('*', { head: true, count: 'exact' })
      .abortSignal(controller.signal);

    clearTimeout(timer);

    if (error) {
      console.debug('useBackendHealth: error during health check', error);
      return 'down';
    } else {
      return 'ok';
    }
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      return 'degraded';
    } else {
      return 'down';
    }
  }
};

export const useBackendHealthQuery = () => {
  return useQuery({
    queryKey: queryKeys.backendHealth(),
    queryFn: checkBackendHealth,
    staleTime: 1000 * 30, // 30 seconds - health checks kunnen frequenter
    gcTime: 1000 * 60, // 1 minute cache
    refetchInterval: 1000 * 60, // Check elke minuut
    retry: false, // Geen retry voor health checks
  });
};
