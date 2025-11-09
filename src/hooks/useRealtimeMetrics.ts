import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SystemMetric } from '@/types/admin';

export const useRealtimeMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates on system_metrics
    const channel = supabase
      .channel('system-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_metrics'
        },
        (payload) => {
          const newMetric = payload.new as SystemMetric;
          setMetrics((prev) => [newMetric, ...prev].slice(0, 100)); // Keep last 100
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { metrics, isConnected };
};
