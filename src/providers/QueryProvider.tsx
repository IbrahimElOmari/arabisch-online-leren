
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configureer QueryClient met optimale settings voor onze app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data blijft fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - cache cleanup
      retry: (failureCount, error: any) => {
        // Slim retry gedrag
        if (error?.code === 'PGRST116') return false; // RLS error, stop retry
        if (error?.name === 'AbortError') return false; // Timeout, stop retry
        return failureCount < 2; // Max 2 retries voor andere errors
      },
      refetchOnWindowFocus: false, // Voorkom onnodige refetches
      refetchOnReconnect: true, // Wel refetch na reconnect
    },
    mutations: {
      retry: 1, // Mutations krijgen 1 retry
    },
  },
});

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};
