import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as forumService from '@/services/forumService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  },
}));

describe('ForumService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchForumThreads', () => {
    it('should fetch threads for a class', async () => {
      const mockThreads = [
        { id: '1', title: 'Thread 1', class_id: 'class-1', profiles: { full_name: 'User 1' } },
        { id: '2', title: 'Thread 2', class_id: 'class-1', profiles: { full_name: 'User 2' } },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockThreads, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await forumService.fetchForumThreads('class-1');
      
      expect(supabase.from).toHaveBeenCalledWith('forum_threads');
      expect(mockQuery.eq).toHaveBeenCalledWith('class_id', 'class-1');
      expect(result).toEqual(mockThreads);
    });

    it('should throw error on database failure', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(forumService.fetchForumThreads('class-1')).rejects.toThrow();
    });
  });

  describe('fetchForumPosts', () => {
    it('should fetch posts for a thread in ascending order', async () => {
      const mockPosts = [
        { id: '1', thread_id: 'thread-1', created_at: '2024-01-01' },
        { id: '2', thread_id: 'thread-1', created_at: '2024-01-02' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await forumService.fetchForumPosts('thread-1');
      
      expect(supabase.from).toHaveBeenCalledWith('forum_posts');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toEqual(mockPosts);
    });
  });

  describe('createForumThread', () => {
    it('should create a new thread', async () => {
      const threadData = {
        class_id: 'class-1',
        title: 'New Thread',
        content: 'Thread content',
        author_id: 'user-1',
      };

      const mockThread = { id: 'thread-1', ...threadData };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockThread, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await forumService.createForumThread(threadData);
      
      expect(mockQuery.insert).toHaveBeenCalledWith(threadData);
      expect(result).toEqual(mockThread);
    });

    it('should throw error on creation failure', async () => {
      const threadData = {
        class_id: 'class-1',
        title: 'New Thread',
        content: 'Thread content',
        author_id: 'user-1',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(forumService.createForumThread(threadData)).rejects.toThrow();
    });
  });

  describe('createForumPost', () => {
    it('should create a new post in a thread', async () => {
      const postData = {
        thread_id: 'thread-1',
        class_id: 'class-1',
        author_id: 'user-1',
        titel: 'Post Title',
        inhoud: 'Post content',
      };

      const mockPost = { id: 'post-1', ...postData };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await forumService.createForumPost(postData);
      
      expect(supabase.from).toHaveBeenCalledWith('forum_posts');
      expect(result).toEqual(mockPost);
    });
  });

  describe('updateForumPost', () => {
    it('should update post content', async () => {
      const updates = { inhoud: 'Updated content' };
      const mockUpdatedPost = { id: 'post-1', ...updates };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedPost, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await forumService.updateForumPost('post-1', updates);
      
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'post-1');
      expect(result).toEqual(mockUpdatedPost);
    });
  });

  describe('deleteForumPost', () => {
    it('should soft delete a post by setting is_verwijderd to true', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await forumService.deleteForumPost('post-1');
      
      expect(mockQuery.update).toHaveBeenCalledWith({ is_verwijderd: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'post-1');
    });
  });

  describe('reportForumPost', () => {
    it('should mark post as reported', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await forumService.reportForumPost('post-1');
      
      expect(mockQuery.update).toHaveBeenCalledWith({ is_gerapporteerd: true });
    });
  });

  describe('toggleLike', () => {
    it('should create new like when none exists', async () => {
      const selectMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      };

      const insertMock = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(selectMock as any)
        .mockReturnValueOnce(insertMock as any);

      await forumService.toggleLike('post-1', 'user-1', true);
      
      expect(insertMock.insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: 'user-1',
        is_like: true,
      });
    });

    it('should remove like when same type already exists', async () => {
      const selectMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { id: 'like-1', is_like: true } 
        }),
      };

      const deleteMock = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(selectMock as any)
        .mockReturnValueOnce(deleteMock as any);

      await forumService.toggleLike('post-1', 'user-1', true);
      
      expect(deleteMock.delete).toHaveBeenCalled();
    });

    it('should update like when opposite type exists', async () => {
      const selectMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { id: 'like-1', is_like: false } 
        }),
      };

      const updateMock = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(selectMock as any)
        .mockReturnValueOnce(updateMock as any);

      await forumService.toggleLike('post-1', 'user-1', true);
      
      expect(updateMock.update).toHaveBeenCalledWith({ is_like: true });
    });
  });
});
