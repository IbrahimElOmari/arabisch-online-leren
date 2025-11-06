import { describe, it, expect, vi, beforeEach } from 'vitest';
import { forumService } from '@/services/forumServiceEdge';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('forumService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listPosts', () => {
    it('should fetch forum posts with filters', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Test Post', content: 'Content' }
      ];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { posts: mockPosts },
        error: null
      });

      const result = await forumService.listPosts({ class_id: 'class-1' });
      
      expect(result).toEqual(mockPosts);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('forum-posts-list', {
        body: { class_id: 'class-1' }
      });
    });
  });

  describe('createPost', () => {
    it('should create a new forum post', async () => {
      const newPost = {
        class_id: 'class-1',
        title: 'New Post',
        content: 'Post content'
      };

      const mockCreated = { id: 'post-1', ...newPost };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { post: mockCreated },
        error: null
      });

      const result = await forumService.createPost(newPost);
      
      expect(result).toEqual(mockCreated);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('forum-posts-create', {
        body: newPost
      });
    });
  });

  describe('updatePost', () => {
    it('should update an existing post', async () => {
      const postId = 'post-1';
      const updates = { title: 'Updated Title' };
      const mockUpdated = { id: postId, ...updates };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { post: mockUpdated },
        error: null
      });

      const result = await forumService.updatePost(postId, updates);
      
      expect(result).toEqual(mockUpdated);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('forum-posts-update', {
        body: { id: postId, ...updates }
      });
    });
  });

  describe('deletePost', () => {
    it('should delete a forum post', async () => {
      const postId = 'post-1';

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null
      });

      await forumService.deletePost(postId);
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('forum-posts-delete', {
        body: { id: postId }
      });
    });
  });
});
