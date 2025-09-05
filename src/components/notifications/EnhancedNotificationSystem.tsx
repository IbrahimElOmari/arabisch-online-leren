import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { toast } from '@/hooks/use-toast';

// Lightweight global notification toasts using realtime INSERT events
export const EnhancedNotificationSystem = () => {
  const { profile } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel(`notification_toasts:${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${profile.id}`,
      }, (payload: any) => {
        const message = payload?.new?.message ?? 'Nieuwe notificatie';
        toast({
          title: 'Notificatie',
          description: message,
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [profile?.id]);

  return null;
};

export default EnhancedNotificationSystem;
