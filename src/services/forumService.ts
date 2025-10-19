import { supabase } from '@/integrations/supabase/client';

/**
 * Forum Service Layer
 * All forum-related database operations
 */

export async function fetchForumThreads(classId: string) {
  const { data, error } = await supabase
    .from('forum_threads')
    .select(`
      *,
      profiles!forum_threads_author_id_fkey(full_name, role)
    `)
    .eq('class_id', classId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function fetchForumPosts(threadId: string) {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      *,
      profiles!forum_posts_author_id_fkey(full_name, role)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createForumThread(threadData: {
  class_id: string;
  title: string;
  content: string;
  author_id: string;
}) {
  const { data, error } = await supabase
    .from('forum_threads')
    .insert(threadData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createForumPost(postData: {
  thread_id: string;
  class_id: string;
  author_id: string;
  titel: string;
  inhoud: string;
}) {
  const { data, error } = await supabase
    .from('forum_posts')
    .insert(postData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateForumPost(postId: string, updates: { inhoud?: string }) {
  const { data, error } = await supabase
    .from('forum_posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteForumPost(postId: string) {
  const { error } = await supabase
    .from('forum_posts')
    .update({ is_verwijderd: true })
    .eq('id', postId);
  
  if (error) throw error;
}

export async function reportForumPost(postId: string) {
  const { error } = await supabase
    .from('forum_posts')
    .update({ is_gerapporteerd: true })
    .eq('id', postId);
  
  if (error) throw error;
}

export async function toggleLike(postId: string, userId: string, isLike: boolean) {
  // Check if like already exists
  const { data: existing } = await supabase
    .from('forum_likes')
    .select('id, is_like')
    .eq('post_id', postId)
    .eq('user_id', userId)
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
      .insert({ post_id: postId, user_id: userId, is_like: isLike });
    if (error) throw error;
  }
}
