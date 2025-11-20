import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

export interface BackupJob {
  id: string;
  requested_by: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  note?: string;
  artifact_url?: string;
  created_at: string;
  finished_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  meta: Record<string, any>;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
  };
}

// Validation schemas
export const maintenanceModeSchema = z.object({
  enabled: z.boolean(),
});

export const backupJobSchema = z.object({
  note: z.string().max(500).optional(),
});

export const adminOpsService = {
  async toggleMaintenance(enabled: boolean): Promise<{ success: boolean; enabled: boolean }> {
    // Validate input
    const validated = maintenanceModeSchema.parse({ enabled });
    
    const { data, error } = await supabase.functions.invoke('admin-ops', {
      body: { enabled: validated.enabled },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) throw error;
    return data;
  },

  async createBackupJob(note?: string): Promise<{ success: boolean; job: BackupJob }> {
    // Validate input
    const validated = backupJobSchema.parse({ note });
    
    const { data, error } = await supabase.functions.invoke('admin-ops', {
      body: { note: validated.note || '' },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) throw error;
    return data;
  },

  async getAuditLogs(): Promise<{ data: AuditLog[] }> {
    const { data, error } = await supabase.functions.invoke('admin-ops', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) throw error;
    return data;
  },

  async getBackupJobs(): Promise<BackupJob[]> {
    const { data, error } = await supabase
      .from('backup_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BackupJob[];
  },

  async getSystemSettings(): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) throw error;

    // Convert to key-value object
    const settings: Record<string, any> = {};
    data?.forEach(setting => {
      settings[setting.key] = setting.value;
    });

    return settings;
  },

  async isMaintenanceMode(): Promise<boolean> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    if (error) return false;
    const value = data?.value as any;
    return value?.enabled === true;
  }
};
