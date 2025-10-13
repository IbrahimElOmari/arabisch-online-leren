import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { UserProfile, EnrolledClass } from '@/types/app';

// NOTE: RBAC migration complete - using useUserRole for role checks

/**
 * Fetches classes for a user based on their role
 * @param userId - The user ID
 * @param role - The user role
 * @returns Promise resolving to EnrolledClass array
 */
const fetchUserClasses = async (userId: string, role: string): Promise<EnrolledClass[]> => {
  console.debug('🔄 fetchUserClasses: Fetching classes for role:', role);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    let formattedClasses: EnrolledClass[] = [];

    if (role === 'admin') {
      const { data, error } = await supabase
        .from('klassen')
        .select('id, name, description')
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);
      
      if (error) throw error;
      
      formattedClasses = data?.map(klas => ({
        id: `admin-${klas.id}`,
        class_id: klas.id,
        payment_status: 'paid',
        klassen: {
          id: klas.id,
          name: klas.name,
          description: klas.description || ''
        }
      })) || [];
    } else if (role === 'leerkracht') {
      const { data, error } = await supabase
        .from('klassen')
        .select('id, name, description')
        .eq('teacher_id', userId)
        .abortSignal(controller.signal);
      
      if (error) throw error;
      
      formattedClasses = data?.map(klas => ({
        id: `teacher-${klas.id}`,
        class_id: klas.id,
        payment_status: 'paid',
        klassen: {
          id: klas.id,
          name: klas.name,
          description: klas.description || ''
        }
      })) || [];
    } else {
      const { data, error } = await supabase
        .from('inschrijvingen')
        .select(`
          id,
          class_id,
          payment_status,
          klassen:class_id (
            id,
            name,
            description
          )
        `)
        .eq('student_id', userId)
        .eq('payment_status', 'paid')
        .abortSignal(controller.signal);

      if (error) throw error;
      
      formattedClasses = data || [];
    }

    clearTimeout(timeout);
    return formattedClasses;
    
  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ fetchUserClasses: Error:', error);
    throw error;
  }
};

export const useClassesQuery = (profile: UserProfile | null, userId?: string) => {
  const queryClient = useQueryClient();
  
  const effectiveUserId = profile?.id || userId;
  const effectiveRole = profile?.role || 'leerling';

  const query = useQuery({
    queryKey: queryKeys.userClasses(effectiveUserId, effectiveRole),
    queryFn: () => fetchUserClasses(effectiveUserId!, effectiveRole),
    enabled: !!effectiveUserId,
    staleTime: 1000 * 60 * 3, // 3 minutes
    retry: (failureCount, error: any) => {
      if (error?.name === 'AbortError') return false;
      return failureCount < 1;
    },
  });

  const refetchMutation = useMutation({
    mutationFn: () => fetchUserClasses(effectiveUserId!, effectiveRole),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.userClasses(effectiveUserId, effectiveRole), data);
    },
  });

  return {
    enrolledClasses: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetchClasses: () => refetchMutation.mutate(),
    isRefetching: refetchMutation.isPending,
  };
};
