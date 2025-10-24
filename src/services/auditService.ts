import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'role_change'
  | 'data_export'
  | 'admin_impersonate'
  | 'user_delete'
  | 'privilege_escalation'
  | 'sensitive_data_access'
  | 'system_config_change'
  | 'bulk_operation';

export type AuditSeverity = 'info' | 'warning' | 'critical';

interface AuditLogEntry {
  user_id?: string;
  actie: AuditAction;
  details: Record<string, any>;
  severity: AuditSeverity;
  ip_address?: string;
  user_agent?: string;
}

export const auditService = {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabase.from('audit_log').insert({
        user_id: entry.user_id || '00000000-0000-0000-0000-000000000000',
        actie: entry.actie,
        details: entry.details,
        severity: entry.severity,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent || navigator.userAgent
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  },

  async logRoleChange(
    targetUserId: string,
    oldRole: string,
    newRole: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      actie: 'role_change',
      severity: 'warning',
      details: {
        target_user_id: targetUserId,
        old_role: oldRole,
        new_role: newRole,
        reason,
        timestamp: new Date().toISOString()
      }
    });
  },

  async logDataExport(userId: string, dataType: string): Promise<void> {
    await this.log({
      actie: 'data_export',
      severity: 'info',
      details: {
        exported_user: userId,
        data_type: dataType,
        timestamp: new Date().toISOString()
      }
    });
  },

  async logImpersonation(
    targetUserId: string,
    duration: number
  ): Promise<void> {
    await this.log({
      actie: 'admin_impersonate',
      severity: 'critical',
      details: {
        target_user_id: targetUserId,
        duration_minutes: duration,
        timestamp: new Date().toISOString()
      }
    });
  },

  async logSensitiveAccess(
    resource: string,
    operation: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actie: 'sensitive_data_access',
      severity: 'warning',
      details: {
        resource,
        operation,
        metadata,
        timestamp: new Date().toISOString()
      }
    });
  },

  async logBulkOperation(
    operation: string,
    affectedCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actie: 'bulk_operation',
      severity: 'warning',
      details: {
        operation,
        affected_count: affectedCount,
        metadata,
        timestamp: new Date().toISOString()
      }
    });
  }
};
