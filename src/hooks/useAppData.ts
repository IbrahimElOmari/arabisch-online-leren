
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useClassesQuery } from '@/hooks/useClassesQuery';
import { useBackendHealthQuery } from '@/hooks/useBackendHealthQuery';

/**
 * Centralized hook that combines all major app data sources
 * Provides a single point of access for authentication, classes, and backend status
 */
export const useAppData = () => {
  const auth = useAuth();
  const classesQuery = useClassesQuery(auth.profile, auth.user?.id);
  const healthQuery = useBackendHealthQuery();

  return {
    // Auth data
    ...auth,
    
    // Classes data
    enrolledClasses: classesQuery.enrolledClasses,
    classesLoading: classesQuery.isLoading,
    classesError: classesQuery.isError,
    refetchClasses: classesQuery.refetchClasses,
    isRefetchingClasses: classesQuery.isRefetching,
    
    // Backend health
    backendStatus: healthQuery.data,
    backendHealthLoading: healthQuery.isLoading,
    refetchHealth: healthQuery.refetch,
    
    // Combined loading states
    isAppLoading: auth.loading || classesQuery.isLoading,
    hasErrors: classesQuery.isError,
  };
};
