import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from '@/services/searchService';

// Mock supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      ilike: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      or: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      order: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should perform RPC search when available', async () => {
      const mockResults = [
        {
          entity_type: 'forum_thread',
          entity_id: '1',
          title: 'Test Thread',
          body: 'Test content',
          class_id: 'class1',
          created_at: '2024-01-01T00:00:00Z',
          rank: 0.8
        }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockResults,
        error: null
      });

      const result = await SearchService.search('test');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_global', {
        p_query: 'test',
        p_limit: 21,
        p_offset: 0,
        p_class_id: null
      });

      expect(result.results).toEqual(mockResults);
      expect(result.hasMore).toBe(false);
    });

    it('should handle empty query', async () => {
      const result = await SearchService.search('   ');
      
      expect(result.results).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it('should handle search errors by falling back', async () => {
      mockSupabase.rpc.mockRejectedValueOnce(new Error('RPC failed'));
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          or: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null })
            })
          }),
          ilike: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null })
            })
          })
        })
      }));

      const result = await SearchService.search('test');
      
      expect(result.results).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it('should validate query length', async () => {
      await expect(SearchService.search('')).rejects.toThrow();
      await expect(SearchService.search('a'.repeat(101))).rejects.toThrow();
    });

    it('should limit results correctly', async () => {
      const mockResults = Array(25).fill(null).map((_, i) => ({
        entity_type: 'forum_thread',
        entity_id: `${i}`,
        title: `Test ${i}`,
        body: 'content',
        class_id: null,
        created_at: '2024-01-01T00:00:00Z',
        rank: 0.5
      }));

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockResults,
        error: null
      });

      const result = await SearchService.search('test', { limit: 20 });

      expect(result.results).toHaveLength(20);
      expect(result.hasMore).toBe(true);
    });

    it('should filter by entity type', async () => {
      const mockResults = [
        {
          entity_type: 'forum_thread',
          entity_id: '1',
          title: 'Thread',
          body: 'content',
          class_id: null,
          created_at: '2024-01-01T00:00:00Z',
          rank: 0.5
        },
        {
          entity_type: 'lesson',
          entity_id: '2',
          title: 'Lesson',
          body: 'content',
          class_id: null,
          created_at: '2024-01-01T00:00:00Z',
          rank: 0.5
        }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockResults,
        error: null
      });

      const result = await SearchService.search('test', { entityType: 'forum_thread' });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].entity_type).toBe('forum_thread');
    });
  });

  describe('getSuggestions', () => {
    it('should return empty array for short queries', async () => {
      const result = await SearchService.getSuggestions('a');
      expect(result).toEqual([]);
    });

    it('should return suggestions from search index', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          ilike: () => ({
            limit: () => Promise.resolve({
              data: [{ title: 'Test Suggestion' }],
              error: null
            })
          })
        })
      });

      const result = await SearchService.getSuggestions('test');
      expect(result).toEqual(['Test Suggestion']);
    });
  });

  describe('getEntityUrl', () => {
    it('should return correct URLs for different entity types', () => {
      expect(SearchService.getEntityUrl({ 
        entity_type: 'forum_thread', 
        entity_id: '123' 
      } as any)).toBe('/forum/thread/123');
      
      expect(SearchService.getEntityUrl({ 
        entity_type: 'lesson', 
        entity_id: '456' 
      } as any)).toBe('/leerstof/lesson/456');
      
      expect(SearchService.getEntityUrl({ 
        entity_type: 'profile', 
        entity_id: '789' 
      } as any)).toBe('/profile/789');
    });
  });

  describe('getEntityTypeLabel', () => {
    it('should return correct labels for different entity types', () => {
      expect(SearchService.getEntityTypeLabel('forum_thread')).toBe('Forum discussie');
      expect(SearchService.getEntityTypeLabel('lesson')).toBe('Les');
      expect(SearchService.getEntityTypeLabel('profile')).toBe('Gebruiker');
    });
  });
});