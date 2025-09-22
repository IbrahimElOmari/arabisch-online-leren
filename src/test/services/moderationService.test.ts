import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moderationService } from '@/services/moderationService';
import type { AppRole } from '@/types/roles';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [{}], error: null }))
        }))
      }))
    }))
  }
}));

// Mock audit logging
vi.mock('@/utils/audit', () => ({
  logAudit: vi.fn()
}));

import { supabase } from '@/integrations/supabase/client';
import { logAudit } from '@/utils/audit';

describe('moderationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('changeUserRole', () => {
    it('should change user role successfully', async () => {
      const userId = 'test-user-id';
      const newRole: AppRole = 'admin';
      const reason = 'Promoted to admin';

      await moderationService.changeUserRole(userId, newRole, reason);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(logAudit).toHaveBeenCalledWith(
        'user_role_changed',
        { type: 'profile', id: userId },
        { new_role: newRole, reason }
      );
    });

    it('should handle role change without reason', async () => {
      const userId = 'test-user-id';
      const newRole: AppRole = 'leerkracht';

      await moderationService.changeUserRole(userId, newRole);

      expect(logAudit).toHaveBeenCalledWith(
        'user_role_changed',
        { type: 'profile', id: userId },
        { new_role: newRole }
      );
    });
  });

  describe('pinThread', () => {
    it('should pin thread successfully', async () => {
      const threadId = 'test-thread-id';

      await moderationService.pinThread(threadId, 'Test pin reason');

      expect(supabase.from).toHaveBeenCalledWith('forum_threads');
      expect(logAudit).toHaveBeenCalledWith(
        'thread_pinned',
        { type: 'forum_thread', id: threadId },
        { pinned: true }
      );
    });
  });

  describe('archiveThread', () => {
    it('should archive thread successfully', async () => {
      const threadId = 'test-thread-id';
      const reason = 'Outdated content';

      await moderationService.archiveThread(threadId, reason);

      expect(supabase.from).toHaveBeenCalledWith('forum_threads');
      expect(logAudit).toHaveBeenCalledWith(
        'thread_archived',
        { type: 'forum_thread', id: threadId },
        { reason }
      );
    });
  });
});