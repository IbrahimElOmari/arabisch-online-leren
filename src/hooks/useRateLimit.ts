import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rateLimiter, RATE_LIMITS } from '@/utils/rateLimiter';

interface UseRateLimitOptions {
  action: keyof typeof RATE_LIMITS;
  identifier?: string;
}

export const useRateLimit = ({ action, identifier }: UseRateLimitOptions) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const checkRateLimit = useCallback(async (): Promise<boolean> => {
    const config = RATE_LIMITS[action];
    const key = identifier || 'anonymous';

    // Check client-side rate limiting first
    const clientAllowed = rateLimiter.check(action, config, key);
    if (!clientAllowed) {
      setIsBlocked(true);
      const blockDuration = 'blockDurationMs' in config ? config.blockDurationMs : config.windowMs;
      setRetryAfter(Date.now() + blockDuration);
      return false;
    }

    try {
      // Check server-side rate limiting
      const { data, error } = await supabase.functions.invoke('rate-limiter-enhanced', {
        body: {
          identifier: key,
          action_type: action,
          ip_address: undefined, // Let the function get the IP
          user_agent: navigator.userAgent
        }
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return true; // Allow if service is down
      }

      if (!data.allowed) {
        setIsBlocked(true);
        setRetryAfter(Date.now() + (data.retry_after * 1000));
        return false;
      }

      setIsBlocked(false);
      setRetryAfter(null);
      return true;
    } catch (error) {
      console.error('Rate limit service error:', error);
      return true; // Allow if service is unavailable
    }
  }, [action, identifier]);

  const reset = useCallback(() => {
    rateLimiter.reset(action, identifier);
    setIsBlocked(false);
    setRetryAfter(null);
  }, [action, identifier]);

  return {
    checkRateLimit,
    isBlocked,
    retryAfter,
    reset
  };
};