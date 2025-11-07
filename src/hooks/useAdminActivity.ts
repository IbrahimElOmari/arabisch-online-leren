import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AdminActivity, AdminActivityFilters } from '@/types/admin';

export const useAdminActivity = (filters: AdminActivityFilters = {}) => {
  return useQuery({
    queryKey: ['admin-activity', filters],
    queryFn: async (): Promise<{ activities: AdminActivity[]; total: number }> => {
      const { data, error } = await supabase.functions.invoke('admin-activity-list', {
        body: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          activity_type: filters.activity_type,
          admin_user_id: filters.admin_user_id,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch admin activity');
      }

      return {
        activities: data.activities || [],
        total: data.total || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
