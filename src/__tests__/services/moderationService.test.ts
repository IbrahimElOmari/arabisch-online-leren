import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moderationService } from '@/services/moderationService';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from '@/utils/audit';
import { securityLogger } from '@/utils/securityLogger';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: { old_role: 'leerling', new_role: 'leerkracht' }, error: null }),
  },
}));

vi.mock('@/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    THREAD_PINNED: 'THREAD_PINNED',
    THREAD_UNPINNED: 'THREAD_UNPINNED',
    THREAD_ARCHIVED: 'THREAD_ARCHIVED',
    POST_DELETED: 'POST_DELETED',
    LESSON_PUBLISHED: 'LESSON_PUBLISHED',
    LESSON_ARCHIVED: 'LESSON_ARCHIVED',
    TASK_PUBLISHED: 'TASK_PUBLISHED',
    TASK_ARCHIVED: 'TASK_ARCHIVED',
  },
}));

vi.mock('@/utils/securityLogger', () => ({
  securityLogger: {
    logPrivilegeChange: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('ModerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pinThread', () => {
    it('should pin a thread and log audit', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await moderationService.pinThread('thread-1', 'Important discussion');
      
      expect(supabase.from).toHaveBeenCalledWith('forum_threads');
      expect(mockQuery.update).toHaveBeenCalledWith({ is_pinned: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'thread-1');
      expect(logAudit).toHaveBeenCalledWith(
        'THREAD_PINNED',
        { type: 'forum_thread', id: 'thread-1' },
        { reason: 'Important discussion' }
      );
    });

    it('should throw error on database failure', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('DB Error') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(moderationService.pinThread('thread-1')).rejects.toThrow();
    });
  });

  describe('unpinThread', () => {
    it('should unpin a thread and log audit', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await moderationService.unpinThread('thread-1');
      
      expect(mockQuery.update).toHaveBeenCalledWith({ is_pinned: false });
      expect(logAudit).toHaveBeenCalledWith(
        'THREAD_UNPINNED',
        { type: 'forum_thread', id: 'thread-1' },
        { reason: undefined }
      );
    });
  });

  describe('archiveThread', () => {
    it('should archive a thread', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await moderationService.archiveThread('thread-1', 'Outdated content');
      
      expect(mockQuery.update).toHaveBeenCalledWith({ status: 'archived' });
      expect(logAudit).toHaveBeenCalledWith(
        'THREAD_ARCHIVED',
        { type: 'forum_thread', id: 'thread-1' },
        { reason: 'Outdated content' }
      );
    });
  });

  describe('deletePostSoft', () => {
    it('should soft delete a post with moderation message', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await moderationService.deletePostSoft('post-1', 'Violates community guidelines');
      
      expect(mockQuery.update).toHaveBeenCalledWith({
        is_verwijderd: true,
        inhoud: '[Deze post is verwijderd door een moderator]',
      });
      expect(logAudit).toHaveBeenCalledWith(
        'POST_DELETED',
        { type: 'forum_post', id: 'post-1' },
        { reason: 'Violates community guidelines' }
      );
    });
  });

  describe('updateLessonStatus', () => {
    it('should publish a lesson', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await moderationService.updateLessonStatus('lesson-1', 'published');
      
      expect(supabase.from).toHaveBeenCalledWith('lessen');
      expect(mockQuery.update).toHaveBeenCalledWith({ status: 'published' });
      expect(logAudit).toHaveBeenCalledWith(
        'LESSON_PUBLISHED',
        { type: 'lesson', id: 'lesson-1' },
        expect.any(Object)
      );
    });

    it('should archive a lesson', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await moderationService.updateLessonStatus('lesson-1', 'archived', 'Content outdated');
      
      expect(logAudit).toHaveBeenCalledWith(
        'LESSON_ARCHIVED',
        { type: 'lesson', id: 'lesson-1' },
        { status: 'archived', reason: 'Content outdated' }
      );
    });
  });

  describe('updateTaskStatus', () => {
    it('should publish a task', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await moderationService.updateTaskStatus('task-1', 'published');
      
      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(logAudit).toHaveBeenCalledWith(
        'TASK_PUBLISHED',
        { type: 'task', id: 'task-1' },
        expect.any(Object)
      );
    });

    it('should archive a task', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await moderationService.updateTaskStatus('task-1', 'archived');
      
      expect(logAudit).toHaveBeenCalledWith(
        'TASK_ARCHIVED',
        { type: 'task', id: 'task-1' },
        expect.any(Object)
      );
    });
  });

  describe('changeUserRole', () => {
    it('should change user role via RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { old_role: 'leerling', new_role: 'leerkracht' },
        error: null,
      });

      const result = await moderationService.changeUserRole('user-1', 'leerkracht', 'Promoted to teacher');
      
      expect(supabase.rpc).toHaveBeenCalledWith('change_user_role', {
        target_user_id: 'user-1',
        new_role: 'leerkracht',
        reason: 'Promoted to teacher',
      });
      expect(result.success).toBe(true);
      expect(securityLogger.logPrivilegeChange).toHaveBeenCalledWith(
        'user-1',
        'leerling',
        'leerkracht'
      );
    });

    it('should throw error on RPC failure', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('Permission denied'),
      });

      await expect(
        moderationService.changeUserRole('user-1', 'admin')
      ).rejects.toThrow();
    });

    it('should handle undefined reason', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { old_role: 'leerling', new_role: 'admin' },
        error: null,
      });

      await moderationService.changeUserRole('user-1', 'admin');
      
      expect(supabase.rpc).toHaveBeenCalledWith('change_user_role', {
        target_user_id: 'user-1',
        new_role: 'admin',
        reason: undefined,
      });
    });
  });
});
