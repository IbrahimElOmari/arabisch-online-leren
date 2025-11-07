export interface ForumPost {
  id: string;
  class_id: string;
  niveau_id?: string | null;
  author_id: string;
  titel: string;
  inhoud: string;
  media_url?: string | null;
  media_type?: string | null;
  thread_id?: string | null;
  created_at: string;
  updated_at: string;
  is_verwijderd: boolean | null;
  is_gerapporteerd: boolean | null;
  likes_count?: number;
  dislikes_count?: number;
  user_reaction?: 'like' | 'dislike' | null;
  profiles?: {
    full_name: string;
    role: string;
  };
}

export interface ForumThread {
  id: string;
  class_id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
  status: string;
  is_pinned: boolean;
  comments_enabled: boolean;
}

export interface CreatePostData {
  class_id: string;
  niveau_id?: string;
  titel: string;
  inhoud: string;
  media_url?: string;
  media_type?: string;
  thread_id?: string;
}