import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserProfileQuery } from '@/hooks/useUserProfileQuery';
import { supabase } from '@/integrations/supabase/client';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useUserProfileQuery Integration', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user profile successfully', async () => {
    const mockProfile = {
      id: '123',
      full_name: 'Test User',
      email: 'test@example.com',
      role: 'leerling',
      age: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mock successful Supabase response
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })
    } as any);

    const { result } = renderHook(
      () => useUserProfileQuery(mockUser as any),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.profile).toEqual(mockProfile);
    });

    expect(result.current.isLoading).toBe(false);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('handles profile fetch error gracefully', async () => {
    // Mock Supabase error
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Profile not found', code: 'PGRST116' }
          })
        })
      })
    } as any);

    const { result } = renderHook(
      () => useUserProfileQuery(mockUser as any),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.profile).toBeTruthy(); // Should fallback to createFallbackProfile
    });

    expect(result.current.profile?.id).toBe('123');
    expect(result.current.profile?.email).toBe('test@example.com');
  });

  it('returns null when no user provided', () => {
    const { result } = renderHook(
      () => useUserProfileQuery(null),
      { wrapper: createWrapper() }
    );

    expect(result.current.profile).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('refreshes profile data when refreshProfile is called', async () => {
    const mockProfile = {
      id: '123',
      full_name: 'Updated User',
      email: 'test@example.com',
      role: 'leerling',
      age: 26,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })
    } as any);

    const { result } = renderHook(
      () => useUserProfileQuery(mockUser as any),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.profile).toBeTruthy();
    });

    // Test refresh functionality
    result.current.refreshProfile();
    
    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    expect(result.current.profile?.full_name).toBe('Updated User');
  });
});