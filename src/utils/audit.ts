import { supabase } from '@/integrations/supabase/client';

export interface AuditEvent {
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}

export async function logAudit(
  action: string,
  entity: { type: string; id?: string },
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    // Call the database function to log audit event
    const { error } = await supabase.rpc('log_audit_event', {
      p_action: action,
      p_entity_type: entity.type,
      p_entity_id: entity.id || undefined,
      p_meta: (meta || {}) as any
    });

    if (error) {
      if (import.meta.env.DEV) console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error logging audit event:', err);
  }
}

// Common audit actions
export const AUDIT_ACTIONS = {
  // User management
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  
  // Content management
  LESSON_CREATED: 'lesson_created',
  LESSON_PUBLISHED: 'lesson_published',
  LESSON_ARCHIVED: 'lesson_archived',
  
  TASK_CREATED: 'task_created',
  TASK_PUBLISHED: 'task_published',
  TASK_ARCHIVED: 'task_archived',
  
  // Forum moderation
  THREAD_PINNED: 'thread_pinned',
  THREAD_UNPINNED: 'thread_unpinned',
  THREAD_ARCHIVED: 'thread_archived',
  POST_DELETED: 'post_deleted',
  
  // Class management
  CLASS_CREATED: 'class_created',
  CLASS_UPDATED: 'class_updated',
  CLASS_DELETED: 'class_deleted',
  
  // System operations
  MAINTENANCE_MODE_ENABLED: 'maintenance_mode_enabled',
  MAINTENANCE_MODE_DISABLED: 'maintenance_mode_disabled',
  BACKUP_JOB_CREATED: 'backup_job_created',
  
  // GDPR
  GDPR_DATA_EXPORT: 'gdpr_data_export',
  GDPR_DELETION_REQUEST: 'gdpr_deletion_request',
} as const;