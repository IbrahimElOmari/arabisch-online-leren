import { supabase } from '@/integrations/supabase/client';

export interface UserDataExport {
  export_date: string;
  user_id: string;
  profile: any;
  enrollments: any[];
  forum_posts: any[];
  task_submissions: any[];
  messages: any[];
}

export const gdprService = {
  async exportUserData(): Promise<UserDataExport> {
    const { data, error } = await supabase.functions.invoke('gdpr-tools/me/export', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) throw error;
    return data;
  },

  async requestAccountDeletion(reason?: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.functions.invoke('gdpr-tools/me/delete', {
      method: 'POST',
      body: { reason: reason || 'User requested account deletion' },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) throw error;
    return data;
  },

  async downloadUserDataAsFile(): Promise<void> {
    try {
      const exportData = await this.exportUserData();
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download user data:', error);
      throw error;
    }
  }
};