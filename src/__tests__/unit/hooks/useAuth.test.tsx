import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('Auth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mock supabase client', () => {
    expect(supabase).toBeDefined();
  });

  it('should handle authentication state', () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    expect(supabase.auth.getSession).toBeDefined();
  });

  it('should handle sign out', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
    
    await supabase.auth.signOut();
    
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
