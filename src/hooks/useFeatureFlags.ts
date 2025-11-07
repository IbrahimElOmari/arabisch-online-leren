import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeatureFlag, CreateFeatureFlagInput, UpdateFeatureFlagInput } from '@/types/admin';
import { toast } from '@/hooks/use-toast';

export const useFeatureFlags = () => {
  const queryClient = useQueryClient();

  const { data: flags = [], isLoading, error } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlag[]> => {
      const { data, error } = await supabase.functions.invoke('admin-feature-flags', {
        method: 'GET'
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch feature flags');
      }

      return data.flags || [];
    }
  });

  const createFlag = useMutation({
    mutationFn: async (input: CreateFeatureFlagInput) => {
      const { data, error } = await supabase.functions.invoke('admin-feature-flags', {
        method: 'POST',
        body: input
      });

      if (error) {
        throw new Error(error.message || 'Failed to create feature flag');
      }

      return data.flag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast({
        title: 'Success',
        description: 'Feature flag created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const updateFlag = useMutation({
    mutationFn: async (input: UpdateFeatureFlagInput) => {
      const { data, error } = await supabase.functions.invoke('admin-feature-flags', {
        method: 'PUT',
        body: input
      });

      if (error) {
        throw new Error(error.message || 'Failed to update feature flag');
      }

      return data.flag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast({
        title: 'Success',
        description: 'Feature flag updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const deleteFlag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('admin-feature-flags', {
        method: 'DELETE',
        body: { id }
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete feature flag');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast({
        title: 'Success',
        description: 'Feature flag deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return {
    flags,
    isLoading,
    error,
    createFlag: createFlag.mutate,
    updateFlag: updateFlag.mutate,
    deleteFlag: deleteFlag.mutate,
    isCreating: createFlag.isPending,
    isUpdating: updateFlag.isPending,
    isDeleting: deleteFlag.isPending,
  };
};
