import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch paginated notifications', async () => {
      const mockNotifications = [
        { id: '1', type: 'message', is_read: false, created_at: '2024-01-01' },
        { id: '2', type: 'task', is_read: false, created_at: '2024-01-02' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await NotificationService.getNotifications({ page: 1, limit: 20 });
      
      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(result.notifications).toEqual(mockNotifications);
    });

    it('should fetch only unread notifications when specified', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await NotificationService.getNotifications({ unreadOnly: true });
      
      expect(mockQuery.eq).toHaveBeenCalledWith('is_read', false);
    });

    it('should handle pagination correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: new Array(21).fill({ id: '1' }), error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await NotificationService.getNotifications({ page: 2, limit: 20 });
      
      expect(mockQuery.range).toHaveBeenCalledWith(20, 40);
      expect(result.hasMore).toBe(true);
    });

    it('should throw error on database failure', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(NotificationService.getNotifications()).rejects.toThrow();
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const count = await NotificationService.getUnreadCount();
      
      expect(count).toBe(5);
      expect(mockQuery.eq).toHaveBeenCalledWith('is_read', false);
    });

    it('should return 0 when no unread notifications', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const count = await NotificationService.getUnreadCount();
      
      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark a single notification as read', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await NotificationService.markAsRead('notif-1');
      
      expect(mockQuery.update).toHaveBeenCalledWith({ is_read: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'notif-1');
    });

    it('should throw error on failure', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(NotificationService.markAsRead('notif-1')).rejects.toThrow();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await NotificationService.markAllAsRead();
      
      expect(mockQuery.update).toHaveBeenCalledWith({ is_read: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('is_read', false);
    });
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const mockNotification = {
        id: 'new-notif',
        user_id: 'user-1',
        type: 'message',
        payload: { sender_name: 'John' },
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await NotificationService.createNotification(
        'user-1',
        'message',
        { message: { conversation_id: 'conv-1', message_id: 'msg-1', sender_name: 'John', content: 'Hello' } }
      );
      
      expect(result).toEqual(mockNotification);
    });

    it('should validate input with Zod schema', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      // Invalid UUID should throw
      await expect(
        NotificationService.createNotification('invalid-uuid', 'message', {})
      ).rejects.toThrow();
    });
  });

  describe('getNotificationText', () => {
    it('should return correct text for message notification', () => {
      const notification = {
        id: '1',
        user_id: 'user-1',
        type: 'message' as const,
        payload: {
          conversation_id: 'conv-1',
          sender_name: 'John',
          content: 'Hello there!',
        },
        is_read: false,
        created_at: '2024-01-01',
      };

      const result = NotificationService.getNotificationText(notification);
      
      expect(result.title).toContain('John');
      expect(result.actionUrl).toBe('/chat/conv-1');
    });

    it('should return correct text for task notification', () => {
      const notification = {
        id: '1',
        user_id: 'user-1',
        type: 'task' as const,
        payload: {
          task_id: 'task-1',
          task_title: 'Complete Assignment',
        },
        is_read: false,
        created_at: '2024-01-01',
      };

      const result = NotificationService.getNotificationText(notification);
      
      expect(result.title).toBe('Nieuwe opdracht');
      expect(result.description).toContain('Complete Assignment');
    });

    it('should return correct text for grade notification', () => {
      const notification = {
        id: '1',
        user_id: 'user-1',
        type: 'grade' as const,
        payload: {
          task_id: 'task-1',
          task_title: 'Math Quiz',
          grade: 85,
        },
        is_read: false,
        created_at: '2024-01-01',
      };

      const result = NotificationService.getNotificationText(notification);
      
      expect(result.description).toContain('85/100');
      expect(result.description).toContain('Math Quiz');
    });
  });

  describe('getNotificationIcon', () => {
    it('should return correct icons for each type', () => {
      expect(NotificationService.getNotificationIcon('message')).toBe('💬');
      expect(NotificationService.getNotificationIcon('task')).toBe('📝');
      expect(NotificationService.getNotificationIcon('forum')).toBe('💭');
      expect(NotificationService.getNotificationIcon('grade')).toBe('📊');
      expect(NotificationService.getNotificationIcon('system')).toBe('⚙️');
    });

    it('should return default icon for unknown type', () => {
      expect(NotificationService.getNotificationIcon('unknown' as any)).toBe('🔔');
    });
  });
});
