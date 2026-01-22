import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gdprService } from '@/services/gdprService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('GDPRService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('should fetch user data export via edge function', async () => {
      const mockExport = {
        export_date: '2024-01-01',
        user_id: 'user-1',
        profile: { full_name: 'Test User' },
        enrollments: [],
        forum_posts: [],
        task_submissions: [],
        messages: [],
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockExport,
        error: null,
      });

      const result = await gdprService.exportUserData();
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('gdpr-tools/me/export', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockExport);
    });

    it('should throw error on export failure', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Export failed'),
      });

      await expect(gdprService.exportUserData()).rejects.toThrow();
    });
  });

  describe('requestAccountDeletion', () => {
    it('should request account deletion with reason', async () => {
      const mockResponse = {
        success: true,
        message: 'Deletion request submitted',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await gdprService.requestAccountDeletion('Privacy concerns');
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('gdpr-tools/me/delete', {
        method: 'POST',
        body: { reason: 'Privacy concerns' },
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should use default reason when not provided', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, message: 'OK' },
        error: null,
      });

      await gdprService.requestAccountDeletion();
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('gdpr-tools/me/delete', {
        method: 'POST',
        body: { reason: 'User requested account deletion' },
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should throw error on deletion request failure', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Deletion failed'),
      });

      await expect(gdprService.requestAccountDeletion()).rejects.toThrow();
    });
  });

  describe('downloadUserDataAsFile', () => {
    it('should create and download a JSON file', async () => {
      const mockExport = {
        export_date: '2024-01-01',
        user_id: 'user-1',
        profile: { full_name: 'Test User' },
        enrollments: [],
        forum_posts: [],
        task_submissions: [],
        messages: [],
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockExport,
        error: null,
      });

      // Mock DOM methods
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      document.createElement = vi.fn().mockReturnValue(mockAnchor);
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      await gdprService.downloadUserDataAsFile();
      
      expect(mockAnchor.download).toMatch(/user_data_\d{4}-\d{2}-\d{2}\.json/);
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should throw error when export fails', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Export failed'),
      });

      await expect(gdprService.downloadUserDataAsFile()).rejects.toThrow();
    });
  });
});
