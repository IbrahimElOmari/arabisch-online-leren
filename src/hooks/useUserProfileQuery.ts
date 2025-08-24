
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'leerkracht' | 'leerling';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  parent_email?: string;
}

const createFallbackProfile = (userId: string, userData?: User): UserProfile => {
  return {
    id: userId,
    full_name: userData?.user_metadata?.full_name || 'Gebruiker',
    role: (userData?.user_metadata?.role || 'leerling') as UserRole,
    parent_email: userData?.user_metadata?.parent_email
  };
};

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  console.debug('🔍 fetchUserProfile: Fetching for user:', userId);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .abortSignal(controller.signal)
      .single();

    clearTimeout(timeout);

    if (error) {
      console.warn('⚠️ fetchUserProfile: Database error, using fallback');
      const { data: userData } = await supabase.auth.getUser();
      return createFallbackProfile(userId, userData.user || undefined);
    }

    return data as UserProfile;
    
  } catch (error) {
    console.warn('⚠️ fetchUserProfile: Exception, using fallback:', error);
    const { data: userData } = await supabase.auth.getUser();
    return createFallbackProfile(userId, userData.user || undefined);
  }
};

export const useUserProfileQuery = (user: User | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.userProfile(user?.id),
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Geen retry voor deze query - we hebben altijd fallback
      return false;
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => fetchUserProfile(user!.id),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.userProfile(user?.id), data);
      toast({
        title: "Profiel bijgewerkt",
        description: "Je profiel is succesvol bijgewerkt",
      });
    },
    onError: (error) => {
      console.error('❌ useUserProfileQuery: Refresh failed:', error);
      toast({
        title: "Profiel bijwerken mislukt",
        description: "Er ging iets mis bij het bijwerken van je profiel",
        variant: "destructive"
      });
    },
  });

  return {
    profile: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refreshProfile: () => refreshMutation.mutate(),
    isRefreshing: refreshMutation.isPending,
  };
};
