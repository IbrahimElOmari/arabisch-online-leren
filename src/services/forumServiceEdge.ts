import { supabase } from '@/integrations/supabase/client';
import type { ForumPost, CreatePostData } from '@/types/forum';

export const forumServiceEdge = {
  async listPosts(
    classId: string,
    niveauId?: string,
    limit = 20,
    offset = 0
  ): Promise<{ posts: ForumPost[]; total: number }> {
    const params = new URLSearchParams({
      class_id: classId,
      limit: limit.toString(),
      offset: offset.toString()
    });

    if (niveauId) {
      params.append('niveau_id', niveauId);
    }

    const { data, error } = await supabase.functions.invoke('forum-posts-list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to fetch forum posts');
    }

    // Fallback to direct query if edge function not available
    if (!data || !data.posts) {
      return await this.listPostsDirect(classId, niveauId, limit, offset);
    }

    return {
      posts: data.posts,
      total: data.total || data.posts.length
    };
  },

  async listPostsDirect(
    classId: string,
    niveauId?: string,
    limit = 20,
    offset = 0
  ): Promise<{ posts: ForumPost[]; total: number }> {
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        profiles!forum_posts_author_id_fkey(full_name, role),
        forum_likes(is_like, user_id)
      `, { count: 'exact' })
      .eq('class_id', classId)
      .eq('is_verwijderd', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (niveauId) {
      query = query.eq('niveau_id', niveauId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();

    interface ForumLike {
      is_like: boolean;
      user_id: string;
    }

    const posts = data?.map(post => {
      const forumLikes = (post.forum_likes || []) as ForumLike[];
      const likes = forumLikes.filter(l => l.is_like).length || 0;
      const dislikes = forumLikes.filter(l => !l.is_like).length || 0;
      const userLiked = forumLikes.find(l => l.user_id === user?.id)?.is_like;
      
      return {
        ...post,
        likes_count: likes,
        dislikes_count: dislikes,
        user_reaction: userLiked !== undefined ? (userLiked ? 'like' as const : 'dislike' as const) : null,
        forum_likes: undefined
      };
    }) || [];

    return { posts, total: count || 0 };
  },

  async createPost(postData: CreatePostData): Promise<ForumPost> {
    const { data, error } = await supabase.functions.invoke('forum-posts-create', {
      body: postData
    });

    if (error) {
      throw new Error(error.message || 'Failed to create forum post');
    }

    return data.post;
  },

  async updatePost(postId: string, content: string): Promise<ForumPost> {
    const { data, error } = await supabase.functions.invoke('forum-posts-update', {
      body: {
        post_id: postId,
        inhoud: content
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to update forum post');
    }

    return data.post;
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('forum-posts-delete', {
      body: { post_id: postId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to delete forum post');
    }
  },

  async reportPost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('forum_posts')
      .update({ is_gerapporteerd: true })
      .eq('id', postId);

    if (error) throw error;
  },

  async toggleLike(postId: string, isLike: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if like already exists
    const { data: existing } = await supabase
      .from('forum_likes')
      .select('id, is_like')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      if (existing.is_like === isLike) {
        // Remove like
        const { error } = await supabase
          .from('forum_likes')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Update like type
        const { error } = await supabase
          .from('forum_likes')
          .update({ is_like: isLike })
          .eq('id', existing.id);
        if (error) throw error;
      }
    } else {
      // Create new like
      const { error } = await supabase
        .from('forum_likes')
        .insert({ post_id: postId, user_id: user.id, is_like: isLike });
      if (error) throw error;
    }
  }
};