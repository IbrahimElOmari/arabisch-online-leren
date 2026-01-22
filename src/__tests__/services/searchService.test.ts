import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from '@/services/searchService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should search using RPC full-text search', async () => {
      const mockResults = [
        { entity_type: 'forum_thread', entity_id: '1', title: 'Test Thread', rank: 0.8 },
        { entity_type: 'task', entity_id: '2', title: 'Test Task', rank: 0.6 },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockResults, error: null });

      const result = await SearchService.search('test');
      
      expect(supabase.rpc).toHaveBeenCalledWith('search_global', expect.objectContaining({
        p_query: 'test',
        p_limit: 21,
        p_offset: 0,
      }));
      expect(result.results).toEqual(mockResults);
    });

    it('should validate query with Zod schema', async () => {
      await expect(SearchService.search('')).rejects.toThrow();
    });

    it('should reject queries over 100 characters', async () => {
      const longQuery = 'a'.repeat(101);
      await expect(SearchService.search(longQuery)).rejects.toThrow();
    });

    it('should handle pagination correctly', async () => {
      const mockResults = new Array(21).fill({ entity_type: 'forum_thread', entity_id: '1' });
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockResults, error: null });

      const result = await SearchService.search('test', { limit: 20 });
      
      expect(result.hasMore).toBe(true);
      expect(result.results.length).toBe(20);
    });

    it('should filter by entity type when specified', async () => {
      const mockResults = [
        { entity_type: 'forum_thread', entity_id: '1' },
        { entity_type: 'task', entity_id: '2' },
        { entity_type: 'forum_thread', entity_id: '3' },
      ];
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockResults, error: null });

      const result = await SearchService.search('test', { entityType: 'forum_thread' });
      
      expect(result.results.every(r => r.entity_type === 'forum_thread')).toBe(true);
    });

    it('should fallback to ILIKE search on RPC failure', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('RPC failed') });
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await SearchService.search('test');
      
      expect(supabase.from).toHaveBeenCalled();
      expect(result.results).toEqual([]);
    });

    it('should trim whitespace from query', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null });

      await SearchService.search('  test query  ');
      
      expect(supabase.rpc).toHaveBeenCalledWith('search_global', expect.objectContaining({
        p_query: 'test query',
      }));
    });
  });

  describe('getSuggestions', () => {
    it('should return empty array for queries less than 2 characters', async () => {
      const result = await SearchService.getSuggestions('a');
      expect(result).toEqual([]);
    });

    it('should fetch suggestions from global_search_index', async () => {
      const mockSuggestions = [
        { title: 'Arabic Grammar' },
        { title: 'Arabic Vocabulary' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockSuggestions, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await SearchService.getSuggestions('arab');
      
      expect(result).toEqual(['Arabic Grammar', 'Arabic Vocabulary']);
    });

    it('should handle errors gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await SearchService.getSuggestions('test');
      
      expect(result).toEqual([]);
    });
  });

  describe('getEntityUrl', () => {
    it('should return correct URL for forum_thread', () => {
      const result = SearchService.getEntityUrl({
        entity_type: 'forum_thread',
        entity_id: 'thread-1',
        title: '',
        body: '',
        class_id: null,
        created_at: '',
        rank: 0,
      });
      expect(result).toBe('/forum/thread/thread-1');
    });

    it('should return correct URL for task', () => {
      const result = SearchService.getEntityUrl({
        entity_type: 'task',
        entity_id: 'task-1',
        title: '',
        body: '',
        class_id: null,
        created_at: '',
        rank: 0,
      });
      expect(result).toBe('/taken/task/task-1');
    });

    it('should return correct URL for lesson', () => {
      const result = SearchService.getEntityUrl({
        entity_type: 'lesson',
        entity_id: 'lesson-1',
        title: '',
        body: '',
        class_id: null,
        created_at: '',
        rank: 0,
      });
      expect(result).toBe('/leerstof/lesson/lesson-1');
    });

    it('should return correct URL for profile', () => {
      const result = SearchService.getEntityUrl({
        entity_type: 'profile',
        entity_id: 'user-1',
        title: '',
        body: '',
        class_id: null,
        created_at: '',
        rank: 0,
      });
      expect(result).toBe('/profile/user-1');
    });
  });

  describe('getEntityTypeLabel', () => {
    it('should return Dutch labels for entity types', () => {
      expect(SearchService.getEntityTypeLabel('forum_thread')).toBe('Forum discussie');
      expect(SearchService.getEntityTypeLabel('forum_post')).toBe('Forum bericht');
      expect(SearchService.getEntityTypeLabel('lesson')).toBe('Les');
      expect(SearchService.getEntityTypeLabel('task')).toBe('Opdracht');
      expect(SearchService.getEntityTypeLabel('profile')).toBe('Gebruiker');
    });
  });
});
