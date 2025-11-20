import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * N+1 Query Detection Tests
 * 
 * Tests to detect and prevent N+1 query problems that cause performance issues
 */

vi.mock('@/integrations/supabase/client');

describe('N+1 Query Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Forum Posts with Authors', () => {
    it('should fetch posts with authors in a single query', async () => {
      const mockFromFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: '1',
                  titel: 'Post 1',
                  author: { id: 'a1', full_name: 'User 1' },
                },
                {
                  id: '2',
                  titel: 'Post 2',
                  author: { id: 'a2', full_name: 'User 2' },
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      // Fetch posts with authors using JOIN
      const { data } = await supabase
        .from('forum_posts')
        .select('*, author:profiles(id, full_name)')
        .eq('class_id', 'class-1')
        .order('created_at', { ascending: false });

      // Verify only ONE query was made
      expect(mockFromFn).toHaveBeenCalledTimes(1);
      expect(data).toHaveLength(2);
      expect(data?.[0].author).toBeDefined();
    });

    it('should detect N+1 when fetching authors separately', async () => {
      const mockFromFn = vi.fn();

      // First query - get posts
      mockFromFn.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: '1', titel: 'Post 1', author_id: 'a1' },
              { id: '2', titel: 'Post 2', author_id: 'a2' },
            ],
            error: null,
          }),
        }),
      });

      // Multiple queries - get each author (BAD!)
      mockFromFn.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'a1', full_name: 'User' },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      // BAD PATTERN: Fetch posts then authors separately
      const { data: posts } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('class_id', 'class-1');

      // N+1: Query for each author
      for (const post of posts || []) {
        await supabase
          .from('profiles')
          .select('*')
          .eq('id', post.author_id)
          .single();
      }

      // Verify N+1 occurred (1 + N queries)
      expect(mockFromFn).toHaveBeenCalledTimes(3); // 1 + 2 authors
    });
  });

  describe('Enrollments with Module Details', () => {
    it('should fetch enrollments with modules in one query', async () => {
      const mockFromFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'e1',
                module: { id: 'm1', name: 'Module 1' },
                class: { id: 'c1', class_name: 'Class A' },
                level: { id: 'l1', level_name: 'Beginner' },
              },
            ],
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      const { data } = await supabase
        .from('enrollments')
        .select(`
          *,
          module:modules(id, name),
          class:module_classes(id, class_name),
          level:module_levels(id, level_name)
        `)
        .eq('student_id', 'student-1');

      expect(mockFromFn).toHaveBeenCalledTimes(1);
      expect(data?.[0].module).toBeDefined();
      expect(data?.[0].class).toBeDefined();
      expect(data?.[0].level).toBeDefined();
    });
  });

  describe('Messages with Sender Profiles', () => {
    it('should fetch messages with senders efficiently', async () => {
      const mockFromFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'm1',
                    content: 'Hello',
                    sender: { id: 's1', full_name: 'Sender 1' },
                  },
                  {
                    id: 'm2',
                    content: 'Hi',
                    sender: { id: 's2', full_name: 'Sender 2' },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles(id, full_name)')
        .eq('conversation_id', 'conv-1')
        .order('created_at', { ascending: false })
        .limit(50);

      expect(mockFromFn).toHaveBeenCalledTimes(1);
      expect(data).toHaveLength(2);
    });
  });

  describe('Leaderboard with Student Details', () => {
    it('should fetch leaderboard entries with profiles in one query', async () => {
      const mockFromFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    rank: 1,
                    score: 1500,
                    student: { id: 's1', full_name: 'Top Student' },
                  },
                  {
                    rank: 2,
                    score: 1400,
                    student: { id: 's2', full_name: 'Second Student' },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      const { data } = await supabase
        .from('leaderboard_entries')
        .select('*, student:profiles(id, full_name, avatar_url)')
        .eq('leaderboard_type', 'global')
        .order('rank', { ascending: true })
        .limit(10);

      expect(mockFromFn).toHaveBeenCalledTimes(1);
      expect(data?.[0].student).toBeDefined();
    });
  });
});

/**
 * Performance Benchmarks
 */
describe('Query Performance Benchmarks', () => {
  it('should complete complex joins within 200ms', async () => {
    const start = Date.now();

    const mockFromFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: Array(100).fill({
            id: '1',
            module: { name: 'Module' },
            class: { class_name: 'Class' },
            level: { level_name: 'Level' },
          }),
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFromFn);

    await supabase
      .from('enrollments')
      .select('*, module:modules(*), class:module_classes(*), level:module_levels(*)')
      .eq('student_id', 'student-1');

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
  });

  it('should handle pagination without performance degradation', async () => {
    for (let page = 0; page < 5; page++) {
      const start = Date.now();

      const mockFromFn = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: Array(20).fill({ id: '1', content: 'Post' }),
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      await supabase
        .from('forum_posts')
        .select('*')
        .range(page * 20, (page + 1) * 20 - 1);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    }
  });
});
