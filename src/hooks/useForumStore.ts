
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { organizePosts } from '@/utils/forumUtils';

interface ForumThread {
  id: string;
  class_id: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  comments_enabled: boolean;
  created_at: string;
  author?: {
    full_name: string;
  };
  post_count?: number;
}

interface ForumPost {
  id: string;
  thread_id: string;
  author_id: string;
  parent_post_id?: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string;
  };
  replies?: ForumPost[];
}

interface ForumState {
  threads: ForumThread[];
  posts: ForumPost[];
  selectedThread: ForumThread | null;
  loading: boolean;
  error: string | null;
  
  fetchThreads: (classId: string) => Promise<void>;
  createThread: (classId: string, title: string, content: string) => Promise<boolean>;
  fetchPosts: (threadId: string) => Promise<void>;
  createPost: (threadId: string, content: string, parentPostId?: string) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  reportPost: (postId: string) => Promise<boolean>;
  likePost: (postId: string, isLike: boolean) => Promise<boolean>;
  toggleComments: (threadId: string, enabled: boolean) => Promise<boolean>;
  pinThread: (threadId: string, pinned: boolean) => Promise<boolean>;
  setSelectedThread: (thread: ForumThread | null) => void;
}

export const useForumStore = create<ForumState>((set, get) => ({
  threads: [],
  posts: [],
  selectedThread: null,
  loading: false,
  error: null,

  fetchThreads: async (classId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('forum_threads')
        .select(`
          *,
          profiles!forum_threads_author_id_fkey(full_name)
        `)
        .eq('class_id', classId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const threadsWithAuthor = data?.map(thread => ({
        ...thread,
        author: { full_name: thread.profiles?.full_name || 'Onbekende gebruiker' }
      })) || [];

      set({ threads: threadsWithAuthor, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createThread: async (classId: string, title: string, content: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-forum', {
        body: { 
          action: 'create-thread', 
          classId, 
          title, 
          content 
        }
      });

      if (error) throw error;
      
      await get().fetchThreads(classId);
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  fetchPosts: async (threadId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('[useForumStore.fetchPosts] thread:', threadId);

      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles!forum_posts_author_id_fkey(full_name, role)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('[useForumStore.fetchPosts] Raw posts:', data?.length || 0);

      const postsWithAuthor = (data || []).map((post: any) => {
        const normalizedParent =
          post.parent_post_id === undefined || post.parent_post_id === null || post.parent_post_id === ''
            ? null
            : String(post.parent_post_id);

        return {
          ...post,
          parent_post_id: normalizedParent,
          content: post.content ?? post.inhoud ?? '',
          title: post.title ?? post.titel ?? null,
          author: {
            full_name: post.profiles?.full_name || 'Onbekende gebruiker',
            role: post.profiles?.role || 'leerling',
          },
        };
      });

      const organizedPosts = organizePosts(postsWithAuthor as any);
      console.log('[useForumStore.fetchPosts] Organized root count:', organizedPosts.length);

      set({ posts: organizedPosts as any, loading: false });
    } catch (error: any) {
      console.error('[useForumStore.fetchPosts] Error:', error);
      set({ error: error.message, loading: false });
    }
  },

  createPost: async (threadId: string, content: string, parentPostId?: string) => {
    set({ loading: true, error: null });
    try {
      console.log('[useForumStore.createPost] Creating post', {
        threadId,
        hasParent: !!parentPostId,
      });

      // 1) Try edge function (preferred)
      const { error } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: 'create-post',
          threadId,
          content,
          parentPostId,
          parent_post_id: parentPostId ?? null,
        },
      });

      if (error) {
        console.warn('[useForumStore.createPost] Edge function error, fallback to direct insert:', error);

        // 2) Fallback to direct insert (type-safe for forum_posts schema)
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const userId = userData.user?.id;
        if (!userId) throw new Error('Not authenticated');

        // Determine class_id from selectedThread or fetch from thread row
        let classId = get().selectedThread?.class_id || null;
        if (!classId) {
          const { data: threadData, error: threadErr } = await supabase
            .from('forum_threads')
            .select('class_id')
            .eq('id', threadId)
            .single();
          if (threadErr) throw threadErr;
          classId = threadData?.class_id || null;
        }
        if (!classId) {
          throw new Error('Kon class_id niet bepalen voor forum post');
        }

        const { error: insertErr } = await supabase.from('forum_posts').insert([
          {
            thread_id: threadId,
            author_id: userId,
            class_id: classId,
            titel: parentPostId ? 'Reactie' : 'Hoofdbericht',
            inhoud: content,
            parent_post_id: parentPostId ?? null,
            is_verwijderd: false,
          },
        ]);
        if (insertErr) throw insertErr;
      }

      // Always refresh posts immediately (besides realtime)
      await get().fetchPosts(threadId);
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error('[useForumStore.createPost] Error:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  deletePost: async (postId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-forum', {
        body: { action: 'delete-post', postId }
      });

      if (error) throw error;
      
      const currentThread = get().selectedThread;
      if (currentThread) {
        await get().fetchPosts(currentThread.id);
      }
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  toggleComments: async (threadId: string, enabled: boolean) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-forum', {
        body: { 
          action: 'toggle-comments', 
          threadId, 
          commentsEnabled: enabled 
        }
      });

      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  pinThread: async (threadId: string, pinned: boolean) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-forum', {
        body: { 
          action: 'pin-thread', 
          threadId, 
          isPinned: pinned 
        }
      });

      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  reportPost: async (postId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: 'report-post',
          postId
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error reporting post:', error);
      set({ error: (error as Error).message });
      return false;
    }
  },

  likePost: async (postId: string, isLike: boolean) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('manage-forum', {
        body: {
          action: 'like-post',
          postId,
          userId: userData.user.id,
          likeData: { isLike }
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      set({ error: (error as Error).message });
      return false;
    }
  },

  setSelectedThread: (thread: ForumThread | null) => {
    set({ selectedThread: thread });
  }
}));
