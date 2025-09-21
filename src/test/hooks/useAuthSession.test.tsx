import { renderHook, waitFor } from '@testing-library/react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';

describe('useAuthSession Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuthSession());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.authReady).toBe(false);
    expect(result.current.session).toBe(null);
    expect(result.current.user).toBe(null);
  });

  it('sets session and user when getSession returns data', async () => {
    const mockSession = {
      user: { id: '123', email: 'test@example.com' },
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      token_type: 'bearer'
    };
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const { result } = renderHook(() => useAuthSession());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.authReady).toBe(true);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
  });

  it('handles null session correctly', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    const { result } = renderHook(() => useAuthSession());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.authReady).toBe(true);
    expect(result.current.session).toBe(null);
    expect(result.current.user).toBe(null);
  });

  it('calls signOut when signOut function is invoked', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });
    
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null
    });

    const { result } = renderHook(() => useAuthSession());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await result.current.signOut();
    
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('handles auth state changes', async () => {
    const mockUnsubscribe = vi.fn();
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { 
        subscription: { 
          unsubscribe: mockUnsubscribe,
          id: 'test',
          callback: vi.fn()
        } 
      }
    });
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    const { unmount } = renderHook(() => useAuthSession());
    
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});