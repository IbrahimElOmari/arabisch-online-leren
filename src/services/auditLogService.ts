import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

/**
 * Unified Audit Log Service
 * Consolidates audit_log and audit_logs tables
 */

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  meta?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at?: string;
}

// Validation schemas
export const auditLogEntrySchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  action: z.string().min(1).max(100),
  resource_type: z.string().min(1).max(100),
  resource_id: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  details: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional(),
  old_values: z.record(z.any()).optional(),
  new_values: z.record(z.any()).optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  session_id: z.string().optional(),
});

export const auditLogQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  action: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.number().min(1).max(1000).optional(),
});

export const auditLogService = {
  /**
   * Log action to unified audit_logs table
   */
  async log(entry: AuditLogEntry): Promise<void> {
    // Validate input
    auditLogEntrySchema.parse(entry);
    
    const { error } = await supabase.from('audit_logs').insert([{
      actor_id: entry.user_id || null,
      action: entry.action,
      entity_type: entry.resource_type || entry.entity_type || '',
      entity_id: entry.resource_id || entry.entity_id || null,
      meta: {
        ...entry.details,
        ...entry.meta,
        old_values: entry.old_values,
        new_values: entry.new_values,
        severity: entry.severity,
        session_id: entry.session_id
      },
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null
    }]);

    if (error) {
      if (import.meta.env.DEV) console.error('Failed to write audit log:', error);
    }
  },

  /**
   * Retrieve audit logs with filters
   */
  async query(filters: {
    user_id?: string;
    action?: string;
    entity_type?: string;
    entity_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    // Validate inputs
    auditLogQuerySchema.parse(filters);
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.user_id) query = query.eq('actor_id', filters.user_id);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
    if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);
    if (filters.start_date) query = query.gte('created_at', filters.start_date);
    if (filters.end_date) query = query.lte('created_at', filters.end_date);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      if (import.meta.env.DEV) console.error('Failed to query audit logs:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      user_id: row.actor_id || '',
      action: row.action,
      resource_type: row.entity_type,
      resource_id: row.entity_id || undefined,
      details: row.meta as Record<string, any>,
      ip_address: row.ip_address || undefined,
      user_agent: row.user_agent || undefined,
      created_at: row.created_at
    }));
  },

  /**
   * Get recent activity for a user
   */
  async getUserActivity(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    return this.query({ user_id: userId, limit });
  },

  /**
   * Get critical security events
   */
  async getCriticalEvents(hours: number = 24): Promise<AuditLogEntry[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .or('action.ilike.%delete%,action.ilike.%revoke%,action.ilike.%disable%')
      .order('created_at', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) console.error('Failed to fetch critical events:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      user_id: row.actor_id || '',
      action: row.action,
      resource_type: row.entity_type,
      resource_id: row.entity_id || undefined,
      details: row.meta as Record<string, any>,
      ip_address: row.ip_address || undefined,
      user_agent: row.user_agent || undefined,
      created_at: row.created_at
    }));
  },

  /**
   * Export audit logs as CSV
   */
  async exportCSV(filters: Parameters<typeof this.query>[0]): Promise<Blob> {
    const logs = await this.query(filters);

    const headers = ['Timestamp', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Details'];
    const rows = logs.map(log => [
      log.created_at,
      log.user_id,
      log.action,
      log.resource_type,
      log.resource_id || '',
      log.ip_address || '',
      JSON.stringify(log.details || {})
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }
};
