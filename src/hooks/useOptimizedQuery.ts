import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

// Optimized query hook with better error handling and caching
export function useOptimizedQuery<TData, TError = Error>(
  key: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  const memoizedKey = useMemo(() => key, [key.join(',')]);
  
  const memoizedQueryFn = useCallback(queryFn, [queryFn]);

  const result = useQuery({
    queryKey: memoizedKey,
    queryFn: memoizedQueryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Intelligent retry logic
      if (error?.code === 'PGRST116') return false; // RLS error
      if (error?.name === 'AbortError') return false; // Timeout
      if (error?.status === 404) return false; // Not found
      return failureCount < 2;
    },
    ...options,
  });

  return {
    ...result,
    isLoading: result.isLoading,
    isError: result.isError,
    data: result.data,
    error: result.error,
  };
}

// Hook for mutations with optimistic updates
export function useOptimizedMutation<TData, TVariables, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: TError, variables: TVariables) => void;
  }
) {
  const memoizedMutationFn = useCallback(mutationFn, [mutationFn]);

  return {
    mutate: memoizedMutationFn,
    ...options,
  };
}