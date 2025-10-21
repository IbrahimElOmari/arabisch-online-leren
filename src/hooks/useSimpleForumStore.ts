
import { create } from 'zustand';

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  class_id: string;
  created_at: string;
  is_pinned: boolean;
  profiles?: {
    full_name: string;
    role: string;
  };
}

interface ForumPost {
  id: string;
  thread_id: string;
  author_id: string;
  parent_post_id?: string | null;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
  };
  replies?: ForumPost[];
}

interface SimpleForumState {
  threads: ForumThread[];
  posts: ForumPost[];
  selectedThread: ForumThread | null;
  loading: boolean;
  error: string | null;
  
  setThreads: (threads: ForumThread[]) => void;
  setPosts: (posts: ForumPost[]) => void;
  setSelectedThread: (thread: ForumThread | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSimpleForumStore = create<SimpleForumState>((set) => ({
  threads: [],
  posts: [],
  selectedThread: null,
  loading: false,
  error: null,
  
  setThreads: (threads) => set({ threads }),
  setPosts: (posts) => set({ posts }),
  setSelectedThread: (selectedThread) => set({ selectedThread }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
