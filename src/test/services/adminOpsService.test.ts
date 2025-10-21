import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminOpsService } from '@/services/adminOpsService';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('adminOpsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleMaintenanceMode', () => {
    it('should toggle maintenance mode successfully', async () => {
      const mockResponse = { data: { success: true }, error: null };
      (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

      const result = await adminOpsService.toggleMaintenance(true);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-ops', {
        body: { enabled: true }
      });
      expect(result).toEqual({ success: true, enabled: true });
    });

    it('should handle errors when toggling maintenance mode', async () => {
      const mockError = { message: 'Failed to toggle maintenance mode' };
      (supabase.functions.invoke as any).mockResolvedValue({ data: null, error: mockError });

      await expect(adminOpsService.toggleMaintenance(true)).rejects.toThrow('Failed to toggle maintenance mode');
    });
  });

  describe('createBackupJob', () => {
    it('should create backup job successfully', async () => {
      const mockResponse = { data: { jobId: 'test-job-id' }, error: null };
      (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

      const result = await adminOpsService.createBackupJob('Test backup');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-ops', {
        body: { action: 'create_backup_job', note: 'Test backup' }
      });
      expect(result).toEqual({ jobId: 'test-job-id' });
    });

    it('should handle errors when creating backup job', async () => {
      const mockError = { message: 'Failed to create backup job' };
      (supabase.functions.invoke as any).mockResolvedValue({ data: null, error: mockError });

      await expect(adminOpsService.createBackupJob('Test')).rejects.toThrow('Failed to create backup job');
    });
  });

  describe('getAuditLogs', () => {
    it('should fetch audit logs successfully', async () => {
      const mockLogs = [{ id: '1', action: 'test_action', created_at: '2023-01-01' }];
      const mockResponse = { data: mockLogs, error: null };
      (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

      const result = await adminOpsService.getAuditLogs();

      expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-ops', {
        body: { action: 'get_audit_logs' }
      });
      expect(result).toEqual(mockLogs);
    });
  });
});