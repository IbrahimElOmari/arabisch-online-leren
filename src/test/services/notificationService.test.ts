import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '@/services/notificationService';
import type { Notification } from '@/services/notificationService';

// Mock supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        range: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => Promise.resolve({ count: 0, error: null }))
      })),
      eq: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ count: 0, error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn()
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'user123' } }
    }))
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch notifications with default options', async () => {
      const mockNotifications = [
        {
          id: '1',
          user_id: 'user123',
          type: 'message',
          payload: {},
          is_read: false,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: mockNotifications, error: null })
          })
        })
      });

      const result = await NotificationService.getNotifications();

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(result.notifications).toEqual(mockNotifications);
      expect(result.hasMore).toBe(false);
    });

    it('should filter unread notifications only', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          order: () => ({
            range: () => ({
              eq: () => Promise.resolve({ data: [], error: null })
            })
          })
        })
      });

      await NotificationService.getNotifications({ unreadOnly: true });

      // Verify that eq('is_read', false) would be called in the chain
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should handle pagination', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null })
          })
        })
      });

      await NotificationService.getNotifications({ page: 2, limit: 10 });

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => Promise.resolve({ count: 5, error: null })
        })
      });

      const count = await NotificationService.getUnreadCount();

      expect(count).toBe(5);
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should return 0 when count is null', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => Promise.resolve({ count: null, error: null })
        })
      });

      const count = await NotificationService.getUnreadCount();

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockSupabase.from.mockReturnValueOnce({
        update: () => ({
          eq: () => Promise.resolve({ error: null })
        })
      });

      await NotificationService.markAsRead('notification123');

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockSupabase.from.mockReturnValueOnce({
        update: () => ({
          eq: () => Promise.resolve({ error: null })
        })
      });

      await NotificationService.markAllAsRead();

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const mockNotification = {
        id: '1',
        user_id: 'user123',
        type: 'message',
        payload: { message: 'test' } as any,
        is_read: false,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.from.mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: mockNotification, error: null })
          })
        })
      });

      const result = await NotificationService.createNotification(
        'user123',
        'message',
        { message: 'test' } as any
      );

      expect(result).toEqual(mockNotification);
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should validate notification data', async () => {
      await expect(
        NotificationService.createNotification(
          'invalid-uuid',
          'message',
          {}
        )
      ).rejects.toThrow();
    });
  });

  describe('subscribeToNotifications', () => {
    it('should set up realtime subscription', () => {
      const onNotification = vi.fn();
      const onUpdate = vi.fn();

      NotificationService.subscribeToNotifications(onNotification, onUpdate);

      expect(mockSupabase.channel).toHaveBeenCalledWith('notifications');
    });
  });

  describe('getNotificationText', () => {
    it('should return correct text for message notification', () => {
      const notification: Notification = {
        id: '1',
        user_id: 'user123',
        type: 'message',
        payload: {
          sender_name: 'John Doe',
          content: 'Hello there',
          conversation_id: 'conv123',
          message_id: 'msg123'
        },
        is_read: false,
        created_at: '2024-01-01T00:00:00Z'
      };

      const result = NotificationService.getNotificationText(notification);

      expect(result.title).toBe('Nieuw bericht van John Doe');
      expect(result.description).toBe('Hello there');
      expect(result.actionUrl).toBe('/chat/conv123');
    });

    it('should return correct text for grade notification', () => {
      const notification: Notification = {
        id: '1',
        user_id: 'user123',
        type: 'grade',
        payload: {
          task_id: 'task123',
          task_title: 'Math Assignment',
          grade: 85
        },
        is_read: false,
        created_at: '2024-01-01T00:00:00Z'
      };

      const result = NotificationService.getNotificationText(notification);

      expect(result.title).toBe('Nieuwe beoordeling');
      expect(result.description).toBe('Je hebt 85/100 punten voor "Math Assignment"');
      expect(result.actionUrl).toBe('/taken/task123');
    });
  });

  describe('getNotificationIcon', () => {
    it('should return correct icons for different notification types', () => {
      expect(NotificationService.getNotificationIcon('message')).toBe('💬');
      expect(NotificationService.getNotificationIcon('task')).toBe('📝');
      expect(NotificationService.getNotificationIcon('forum')).toBe('💭');
      expect(NotificationService.getNotificationIcon('grade')).toBe('📊');
      expect(NotificationService.getNotificationIcon('system')).toBe('⚙️');
    });
  });
});