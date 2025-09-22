import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Notification interfaces
export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'task' | 'forum' | 'grade' | 'system';
  payload: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPayload {
  message?: {
    conversation_id: string;
    message_id: string;
    sender_name: string;
    content: string;
  };
  task?: {
    task_id: string;
    task_title: string;
    due_date?: string;
  };
  forum?: {
    thread_id: string;
    post_id: string;
    thread_title: string;
    author_name: string;
  };
  grade?: {
    task_id: string;
    task_title: string;
    grade: number;
  };
  system?: {
    title: string;
    message: string;
    action_url?: string;
  };
}

// Validation schema
const notificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['message', 'task', 'forum', 'grade', 'system']),
  payload: z.record(z.any()),
});

export class NotificationService {
  /**
   * Get notifications for current user
   */
  static async getNotifications(options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<{ notifications: Notification[]; hasMore: boolean }> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      notifications: (data || []) as Notification[],
      hasMore: data ? data.length === limit + 1 : false
    };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) throw error;
  }

  /**
   * Create a notification (admin/teacher only)
   */
  static async createNotification(
    userId: string,
    type: Notification['type'],
    payload: NotificationPayload
  ): Promise<Notification> {
    const validated = notificationSchema.parse({
      user_id: userId,
      type,
      payload
    });

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: validated.user_id,
        type: validated.type as any, // Cast to match database enum
        payload: validated.payload as any // Cast to Json type
      })
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(
    onNotification: (notification: Notification) => void,
    onUpdate: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`,
        },
        (payload) => {
          onNotification(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`,
        },
        (payload) => {
          onUpdate(payload.new as Notification);
        }
      )
      .subscribe();
  }

  /**
   * Get notification display text
   */
  static getNotificationText(notification: Notification): {
    title: string;
    description: string;
    actionUrl?: string;
  } {
    const { type, payload } = notification;

    switch (type) {
      case 'message':
        return {
          title: `Nieuw bericht van ${payload.sender_name}`,
          description: payload.content,
          actionUrl: `/chat/${payload.conversation_id}`
        };

      case 'task':
        return {
          title: 'Nieuwe opdracht',
          description: `Opdracht "${payload.task_title}" is beschikbaar`,
          actionUrl: `/taken/${payload.task_id}`
        };

      case 'forum':
        return {
          title: `${payload.author_name} heeft gereageerd`,
          description: `In discussie "${payload.thread_title}"`,
          actionUrl: `/forum/thread/${payload.thread_id}#${payload.post_id}`
        };

      case 'grade':
        return {
          title: 'Nieuwe beoordeling',
          description: `Je hebt ${payload.grade}/100 punten voor "${payload.task_title}"`,
          actionUrl: `/taken/${payload.task_id}`
        };

      case 'system':
        return {
          title: payload.title || 'Systeemmelding',
          description: payload.message,
          actionUrl: payload.action_url
        };

      default:
        return {
          title: 'Nieuwe melding',
          description: 'Je hebt een nieuwe melding ontvangen'
        };
    }
  }

  /**
   * Get notification icon for type
   */
  static getNotificationIcon(type: Notification['type']): string {
    const icons = {
      message: '💬',
      task: '📝',
      forum: '💭',
      grade: '📊',
      system: '⚙️'
    };

    return icons[type] || '🔔';
  }
}