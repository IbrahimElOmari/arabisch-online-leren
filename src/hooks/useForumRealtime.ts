
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeCallbacks {
  onThreadsChange?: () => void;
  onPostsChange?: () => void;
  onNewThread?: (thread: any) => void;
  onNewPost?: (post: any) => void;
}

/**
 * Enhanced realtime hook for comprehensive forum updates.
 * Subscribes to changes for both threads and posts with granular callbacks.
 */
export function useForumRealtime(
  classId: string | null,
  threadId: string | null,
  callbacks: RealtimeCallbacks
) {
  useEffect(() => {
    if (!classId) return;

    console.log('[useForumRealtime] Setting up enhanced realtime for class:', classId);

    const channels: any[] = [];

    // Subscribe to thread changes for this class
    if (callbacks.onThreadsChange || callbacks.onNewThread) {
      const threadsChannel = supabase
        .channel(`forum-threads-${classId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'forum_threads',
            filter: `class_id=eq.${classId}`,
          },
          (payload) => {
            console.log('[useForumRealtime] Thread change:', payload.eventType, payload.new?.title);
            
            if (payload.eventType === 'INSERT' && callbacks.onNewThread) {
              callbacks.onNewThread(payload.new);
            }
            
            if (callbacks.onThreadsChange) {
              callbacks.onThreadsChange();
            }
          }
        )
        .subscribe((status) => {
          console.log('[useForumRealtime] Threads subscription status:', status);
        });

      channels.push(threadsChannel);
    }

    // Subscribe to post changes for specific thread
    if (threadId && (callbacks.onPostsChange || callbacks.onNewPost)) {
      const postsChannel = supabase
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
            console.log('[useForumRealtime] Post change:', payload.eventType, payload.new?.id);
            
            if (payload.eventType === 'INSERT' && callbacks.onNewPost) {
              callbacks.onNewPost(payload.new);
            }
            
            if (callbacks.onPostsChange) {
              callbacks.onPostsChange();
            }
          }
        )
        .subscribe((status) => {
          console.log('[useForumRealtime] Posts subscription status:', status);
        });

      channels.push(postsChannel);
    }

    return () => {
      console.log('[useForumRealtime] Cleaning up realtime subscriptions');
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [classId, threadId, callbacks.onThreadsChange, callbacks.onPostsChange, callbacks.onNewThread, callbacks.onNewPost]);
}

/**
 * Simple hook for thread-specific post updates (backwards compatibility).
 */
export function useForumRealtimeSimple(threadId: string | null, onChange: () => void) {
  return useForumRealtime(null, threadId, { onPostsChange: onChange });
}
