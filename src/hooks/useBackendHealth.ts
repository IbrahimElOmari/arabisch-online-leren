
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type HealthStatus = 'ok' | 'degraded' | 'down';

export const useBackendHealth = () => {
  const [status, setStatus] = useState<HealthStatus>('degraded');
  const [checking, setChecking] = useState<boolean>(false);

  const check = useCallback(async () => {
    setChecking(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000); // 2s timeout

    try {
      // Lichtgewicht HEAD-achtige check
      const { error } = await supabase
        .from('profiles')
        .select('*', { head: true, count: 'exact' })
        .abortSignal(controller.signal);

      clearTimeout(timer);

      if (error) {
        // Fout van PostgREST of RLS = down
        console.debug('useBackendHealth: error during health check', error);
        setStatus('down');
      } else {
        setStatus('ok');
      }
    } catch (err: any) {
      clearTimeout(timer);
      // Abort door timeout => degraded
      if (err?.name === 'AbortError') {
        setStatus('degraded');
      } else {
        setStatus('down');
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { status, checking, check };
};
