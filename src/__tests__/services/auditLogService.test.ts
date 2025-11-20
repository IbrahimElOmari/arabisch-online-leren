import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditLogService } from '@/services/auditLogService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('auditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should write audit log entry', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      await auditLogService.log({
        user_id: 'user-1',
        action: 'content.create',
        resource_type: 'content_library',
        resource_id: 'content-1',
        severity: 'info',
        ip_address: '192.168.1.1'
      });

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          actor_id: 'user-1',
          action: 'content.create',
          entity_type: 'content_library',
          entity_id: 'content-1'
        })
      ]);
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } })
      } as any);

      await auditLogService.log({
        user_id: 'user-1',
        action: 'test.action',
        resource_type: 'test'
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to write audit log:',
        expect.objectContaining({ message: 'Insert failed' })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('query', () => {
    it('should retrieve audit logs with filters', async () => {
      const mockData = [
        {
          id: 'log-1',
          actor_id: 'user-1',
          action: 'content.update',
          entity_type: 'content_library',
          entity_id: 'content-1',
          meta: { key: 'value' },
          created_at: '2025-01-01T00:00:00Z'
        }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await auditLogService.query({
        user_id: 'user-1',
        action: 'content.update',
        limit: 10
      });

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user-1');
      expect(result[0].action).toBe('content.update');
    });
  });

  describe('getUserActivity', () => {
    it('should fetch user activity logs', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await auditLogService.getUserActivity('user-1', 25);

      expect(mockQuery.eq).toHaveBeenCalledWith('actor_id', 'user-1');
      expect(mockQuery.limit).toHaveBeenCalledWith(25);
    });
  });

  describe('getCriticalEvents', () => {
    it('should fetch critical security events', async () => {
      const mockData = [
        {
          id: 'log-1',
          actor_id: 'admin-1',
          action: 'user.delete',
          entity_type: 'profiles',
          entity_id: 'user-2',
          meta: {},
          created_at: new Date().toISOString()
        }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await auditLogService.getCriticalEvents(24);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('user.delete');
    });
  });

  describe('exportCSV', () => {
    it('should export logs as CSV blob', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'log-1',
              actor_id: 'user-1',
              action: 'test.action',
              entity_type: 'test',
              meta: { key: 'value' },
              created_at: '2025-01-01T00:00:00Z'
            }
          ],
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const blob = await auditLogService.exportCSV({ limit: 100 });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8;');

      const text = await blob.text();
      expect(text).toContain('Timestamp,User ID,Action');
      expect(text).toContain('user-1');
      expect(text).toContain('test.action');
    });
  });
});
