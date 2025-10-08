import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Secure role checking via Supabase RPC
 * 
 * This hook uses get_user_role() RPC to fetch the user's role securely.
 * After migrating to user_roles table, this will use has_role() RPC.
 * 
 * Usage:
 * ```tsx
 * const { isAdmin, isTeacher, isStudent } = useUserRole();
 * 
 * if (isAdmin) {
 *   // admin-only logic
 * }
 * ```
 */
export function useUserRole() {
  const { user } = useAuthSession();

  const { data: role, isLoading } = useQuery({
    queryKey: ['user_role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc('get_user_role', {
        user_id: user.id
      });
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      return data as AppRole | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    isAdmin: role === 'admin',
    isTeacher: role === 'leerkracht',
    isStudent: role === 'leerling',
    role,
    isLoading,
  };
}
