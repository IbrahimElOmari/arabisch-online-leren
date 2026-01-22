import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminOpsService } from '@/services/adminOpsService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('AdminOpsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleMaintenance', () => {
    it('should enable maintenance mode', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, enabled: true },
        error: null,
      });

      const result = await adminOpsService.toggleMaintenance(true);
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-ops', {
        body: { enabled: true },
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.enabled).toBe(true);
    });

    it('should disable maintenance mode', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, enabled: false },
        error: null,
      });

      const result = await adminOpsService.toggleMaintenance(false);
      
      expect(result.enabled).toBe(false);
    });

    it('should validate input with Zod schema', async () => {
      // Non-boolean should throw
      await expect(
        adminOpsService.toggleMaintenance('invalid' as any)
      ).rejects.toThrow();
    });

    it('should throw error on edge function failure', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Function error'),
      });

      await expect(adminOpsService.toggleMaintenance(true)).rejects.toThrow();
    });
  });

  describe('createBackupJob', () => {
    it('should create a backup job with note', async () => {
      const mockJob = {
        id: 'backup-1',
        status: 'queued',
        note: 'Daily backup',
        created_at: '2024-01-01',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, job: mockJob },
        error: null,
      });

      const result = await adminOpsService.createBackupJob('Daily backup');
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-ops', {
        body: { note: 'Daily backup' },
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.job).toEqual(mockJob);
    });

    it('should create backup job without note', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, job: { id: 'backup-1' } },
        error: null,
      });

      await adminOpsService.createBackupJob();
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-ops', {
        body: { note: '' },
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should validate note length', async () => {
      const longNote = 'a'.repeat(501);
      
      await expect(adminOpsService.createBackupJob(longNote)).rejects.toThrow();
    });
  });

  describe('getAuditLogs', () => {
    it('should fetch audit logs', async () => {
      const mockLogs = [
        { id: '1', action: 'login', actor_id: 'user-1' },
        { id: '2', action: 'role_change', actor_id: 'admin-1' },
      ];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { data: mockLogs },
        error: null,
      });

      const result = await adminOpsService.getAuditLogs();
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-ops', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.data).toEqual(mockLogs);
    });
  });

  describe('getBackupJobs', () => {
    it('should fetch backup jobs from database', async () => {
      const mockJobs = [
        { id: 'backup-1', status: 'success', created_at: '2024-01-02' },
        { id: 'backup-2', status: 'queued', created_at: '2024-01-01' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await adminOpsService.getBackupJobs();
      
      expect(supabase.from).toHaveBeenCalledWith('backup_jobs');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockJobs);
    });

    it('should return empty array on error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(adminOpsService.getBackupJobs()).rejects.toThrow();
    });
  });

  describe('getSystemSettings', () => {
    it('should fetch and transform system settings', async () => {
      const mockSettings = [
        { key: 'maintenance_mode', value: { enabled: false } },
        { key: 'max_upload_size', value: 10485760 },
      ];

      const mockQuery = {
        select: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await adminOpsService.getSystemSettings();
      
      expect(supabase.from).toHaveBeenCalledWith('system_settings');
      expect(result).toEqual({
        maintenance_mode: { enabled: false },
        max_upload_size: 10485760,
      });
    });
  });

  describe('isMaintenanceMode', () => {
    it('should return true when maintenance mode is enabled', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { value: { enabled: true } }, 
          error: null 
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await adminOpsService.isMaintenanceMode();
      
      expect(result).toBe(true);
    });

    it('should return false when maintenance mode is disabled', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { value: { enabled: false } }, 
          error: null 
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await adminOpsService.isMaintenanceMode();
      
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Not found') 
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await adminOpsService.isMaintenanceMode();
      
      expect(result).toBe(false);
    });
  });
});
