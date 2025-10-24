import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface SecurityAlert {
  id: string;
  actie: string;
  severity: string | null;
  user_id?: string | null;
  details: any;
  created_at: string;
}

export const useSecurityAlerts = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setAlerts(data || []);
      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Failed to load security alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();

    // Subscribe to real-time security events
    const subscription = supabase
      .channel('security_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events'
        },
        (payload) => {
          const newAlert = payload.new as SecurityAlert;
          setAlerts(prev => [newAlert, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for critical alerts
          if (newAlert.severity === 'critical') {
            toast({
              title: t('security.alerts.critical'),
              description: t(`security.alerts.types.${newAlert.type}`),
              variant: 'destructive'
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAlerts, t, toast]);

  const markAsResolved = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_events')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast({
        title: t('security.alerts.resolved'),
        description: t('security.alerts.resolvedMessage')
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast({
        title: t('error.title'),
        description: t('security.alerts.resolveFailed'),
        variant: 'destructive'
      });
    }
  }, [t, toast]);

  const triggerAlert = useCallback(async (
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    details: Record<string, any>
  ) => {
    try {
      await supabase.functions.invoke('security-monitoring', {
        body: {
          action: 'log_security_event',
          type,
          severity,
          details,
          ip_address: undefined, // Let server get IP
          user_agent: navigator.userAgent
        }
      });
    } catch (error) {
      console.error('Failed to trigger security alert:', error);
    }
  }, []);

  return {
    alerts,
    unreadCount,
    isLoading,
    loadAlerts,
    markAsResolved,
    triggerAlert
  };
};
