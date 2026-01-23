import { z } from 'zod';

// ============================================
// FORUM SCHEMAS
// Forum Posts & Replies Validation
// ============================================

export const forumPostSchema = z.object({
  id: z.string().uuid(),
  titel: z.string().min(5, 'Titel moet minimaal 5 tekens zijn').max(200),
  inhoud: z.string().min(10, 'Inhoud moet minimaal 10 tekens zijn'),
  body: z.string().optional().default(''),
  author_id: z.string().uuid(),
  class_id: z.string().uuid(),
  niveau_id: z.string().uuid().optional().nullable(),
  parent_post_id: z.string().uuid().optional().nullable(),
  thread_id: z.string().uuid().optional().nullable(),
  is_gerapporteerd: z.boolean().default(false),
  is_verwijderd: z.boolean().default(false),
  likes_count: z.number().int().default(0),
  dislikes_count: z.number().int().default(0),
  media_url: z.string().url().optional().nullable(),
  media_type: z.enum(['image', 'video', 'audio', 'document']).optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export const forumReplySchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  author_id: z.string().uuid(),
  inhoud: z.string().min(1, 'Reactie mag niet leeg zijn'),
  is_gerapporteerd: z.boolean().default(false),
  is_verwijderd: z.boolean().default(false),
  verwijderd_door: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export const forumThreadSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(10),
  body: z.string().optional().default(''),
  author_id: z.string().uuid(),
  class_id: z.string().uuid(),
  is_pinned: z.boolean().default(false),
  status: z.enum(['open', 'closed', 'archived']).default('open'),
  comments_enabled: z.boolean().default(true),
  created_at: z.string().datetime(),
});

export const forumLikeSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_like: z.boolean(),
  created_at: z.string().datetime(),
});

export const createPostSchema = forumPostSchema.omit({ 
  id: true, 
  author_id: true, 
  created_at: true, 
  updated_at: true,
  is_gerapporteerd: true,
  is_verwijderd: true,
  likes_count: true,
  dislikes_count: true,
});

export const createReplySchema = forumReplySchema.omit({ 
  id: true, 
  author_id: true, 
  created_at: true,
  updated_at: true,
  is_gerapporteerd: true,
  is_verwijderd: true,
  verwijderd_door: true,
});

export const reportPostSchema = z.object({
  post_id: z.string().uuid(),
  reason: z.string().min(10, 'Geef een reden op (min. 10 tekens)'),
});

// Type exports
export type ForumPost = z.infer<typeof forumPostSchema>;
export type ForumReply = z.infer<typeof forumReplySchema>;
export type ForumThread = z.infer<typeof forumThreadSchema>;
export type ForumLike = z.infer<typeof forumLikeSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type ReportPostInput = z.infer<typeof reportPostSchema>;
