
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { organizePosts } from '@/utils/forumUtils';

export interface ForumThread {
  id: string;
  class_id: string;
  author_id: string;
  title: string;
  content: string;
  body: string;
  created_at: string;
  is_pinned: boolean | null;
  comments_enabled: boolean | null;
  status: string | null;
  tsv: unknown;
  post_count?: number;
  author: {
    full_name: string;
  };
  profiles: {
    full_name: string;
  };
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
  
  // Core actions only
  fetchThreads: (classId: string) => Promise<void>;
  fetchPosts: (threadId: string) => Promise<void>;
  createPost: (threadId: string, content: string, parentPostId?: string) => Promise<boolean>;
  setSelectedThread: (thread: ForumThread | null) => void;
  clearError: () => void;
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

  fetchPosts: async (threadId: string) => {
    set({ loading: true, error: null });
    try {
      if (import.meta.env.DEV) {
        console.log('[useForumStore.fetchPosts] thread:', threadId);
      }

      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles!forum_posts_author_id_fkey(full_name, role)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (import.meta.env.DEV) {
        console.log('[useForumStore.fetchPosts] Raw posts:', data?.length || 0);
      }

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
      if (import.meta.env.DEV) {
        console.log('[useForumStore.fetchPosts] Organized root count:', organizedPosts.length);
      }

      set({ posts: organizedPosts as any, loading: false });
    } catch (error: any) {
      console.error('[useForumStore.fetchPosts] Error:', error);
      set({ error: error.message, loading: false });
    }
  },

  createPost: async (threadId: string, content: string, parentPostId?: string) => {
    set({ loading: true, error: null });
    try {
      if (import.meta.env.DEV) {
        console.log('[useForumStore.createPost] Creating post', {
          threadId,
          hasParent: !!parentPostId,
        });
      }

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

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const userId = userData.user?.id;
        if (!userId) throw new Error('Not authenticated');

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

      await get().fetchPosts(threadId);
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error('[useForumStore.createPost] Error:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  setSelectedThread: (thread: ForumThread | null) => {
    set({ selectedThread: thread });
  },

  clearError: () => set({ error: null }),
}));
