import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentLibraryService } from '@/services/contentLibraryService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('contentLibraryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listContent', () => {
    it('should fetch content list successfully', async () => {
      const mockData = [
        { id: '1', title: 'Test Content', content_type: 'prep_lesson' }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await contentLibraryService.listContent();
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('content_library');
    });

    it('should apply filters correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await contentLibraryService.listContent({ 
        module_id: 'mod-1',
        status: 'published' 
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('module_id', 'mod-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published');
    });
  });

  describe('saveContent', () => {
    it('should save content via edge function', async () => {
      const mockContent = { 
        title: 'New Content',
        content_type: 'prep_lesson',
        content_data: { blocks: [] }
      };

      const mockResponse = {
        data: { content: { id: 'new-id', ...mockContent } },
        error: null
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);

      const result = await contentLibraryService.saveContent(mockContent);
      
      expect(result).toEqual(mockResponse.data.content);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('content-save', {
        body: mockContent
      });
    });
  });

  describe('publishContent', () => {
    it('should publish content via edge function', async () => {
      const contentId = 'content-123';
      const mockResponse = {
        data: { content: { id: contentId, status: 'published' } },
        error: null
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);

      const result = await contentLibraryService.publishContent(contentId);
      
      expect(result.status).toBe('published');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('content-publish', {
        body: { content_id: contentId }
      });
    });
  });

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await contentLibraryService.deleteContent('content-123');
      
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'content-123');
    });
  });
});
