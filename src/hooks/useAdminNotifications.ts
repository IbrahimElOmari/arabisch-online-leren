import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Extended notification type with all fields from PR8 migration
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  metadata?: any;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const useAdminNotifications = () => {
  const queryClient = useQueryClient();

  // Fetch notifications with proper casting
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      // Cast to our extended type since DB types may not be updated yet
      return (data || []) as unknown as Notification[];
    },
    refetchInterval: 30000 // 30s fallback polling
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as unknown as Notification;
          
          // Show toast for critical notifications
          if (newNotification.severity === 'critical') {
            toast.error(newNotification.title || 'Critical Alert', {
              description: newNotification.message
            });
          } else if (newNotification.severity === 'warning') {
            toast.warning(newNotification.title || 'Warning', {
              description: newNotification.message
            });
          }

          queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', notificationIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to mark notifications as read', {
        description: error.message
      });
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate
  };
};
