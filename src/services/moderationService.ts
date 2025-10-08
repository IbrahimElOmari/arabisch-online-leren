import { supabase } from '@/integrations/supabase/client';
import { logAudit, AUDIT_ACTIONS } from '@/utils/audit';

export interface ModerationAction {
  id: string;
  reason?: string;
}

export const moderationService = {
  async pinThread(threadId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('forum_threads')
      .update({ is_pinned: true })
      .eq('id', threadId);

    if (error) throw error;

    await logAudit(AUDIT_ACTIONS.THREAD_PINNED, { type: 'forum_thread', id: threadId }, { reason });
  },

  async unpinThread(threadId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('forum_threads')
      .update({ is_pinned: false })
      .eq('id', threadId);

    if (error) throw error;

    await logAudit(AUDIT_ACTIONS.THREAD_UNPINNED, { type: 'forum_thread', id: threadId }, { reason });
  },

  async archiveThread(threadId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('forum_threads')
      .update({ status: 'archived' })
      .eq('id', threadId);

    if (error) throw error;

    await logAudit(AUDIT_ACTIONS.THREAD_ARCHIVED, { type: 'forum_thread', id: threadId }, { reason });
  },

  async deletePostSoft(postId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('forum_posts')
      .update({ 
        is_verwijderd: true,
        inhoud: '[Deze post is verwijderd door een moderator]'
      })
      .eq('id', postId);

    if (error) throw error;

    await logAudit(AUDIT_ACTIONS.POST_DELETED, { type: 'forum_post', id: postId }, { reason });
  },

  async updateLessonStatus(lessonId: string, status: 'draft' | 'published' | 'archived', reason?: string): Promise<void> {
    const { error } = await supabase
      .from('lessen')
      .update({ status })
      .eq('id', lessonId);

    if (error) throw error;

    const action = status === 'published' ? AUDIT_ACTIONS.LESSON_PUBLISHED : 
                   status === 'archived' ? AUDIT_ACTIONS.LESSON_ARCHIVED : 
                   'lesson_status_changed';

    await logAudit(action, { type: 'lesson', id: lessonId }, { status, reason });
  },

  async updateTaskStatus(taskId: string, status: 'draft' | 'published' | 'archived', reason?: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) throw error;

    const action = status === 'published' ? AUDIT_ACTIONS.TASK_PUBLISHED : 
                   status === 'archived' ? AUDIT_ACTIONS.TASK_ARCHIVED : 
                   'task_status_changed';

    await logAudit(action, { type: 'task', id: taskId }, { status, reason });
  },

  async changeUserRole(userId: string, newRole: 'admin' | 'leerkracht' | 'leerling', reason?: string): Promise<void> {
    // Get current role first
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;

    await logAudit(AUDIT_ACTIONS.USER_ROLE_CHANGED, { type: 'profile', id: userId }, { 
      old_role: currentProfile?.role || 'unknown',
      new_role: newRole,
      reason 
    });
  }
};