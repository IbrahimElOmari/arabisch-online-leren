
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to realtime changes for forum_posts within a thread and triggers onChange.
 * Ensures new replies appear immediately without manual refresh.
 */
export function useForumRealtime(threadId: string | null, onChange: () => void) {
  useEffect(() => {
    if (!threadId) return;

    console.log('[useForumRealtime] Subscribing to thread:', threadId);

    const channel = supabase
      .channel(`forum-posts-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_posts',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          console.log('[useForumRealtime] forum_posts change:', payload.eventType, payload.new);
          onChange();
        }
      )
      .subscribe((status) => {
        console.log('[useForumRealtime] subscription status:', status);
      });

    return () => {
      console.log('[useForumRealtime] Unsubscribing from thread:', threadId);
      supabase.removeChannel(channel);
    };
  }, [threadId, onChange]);
}
