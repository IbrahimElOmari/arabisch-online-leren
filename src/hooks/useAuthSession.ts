
import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Beheert Supabase auth status met eenvoudig, voorspelbaar gedrag:
 * - Haalt éénmalig de huidige sessie op (initial load)
 * - Luistert op auth state changes
 * - Biedt loading + authReady flags voor duidelijke routing gates
 */
export const useAuthSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Initial sessie ophalen
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
      setAuthReady(true);
      console.debug('🔐 useAuthSession: initial session loaded, user:', !!data.session?.user);
    });

    // Luisteren naar auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      console.debug('🔄 useAuthSession: auth state changed, user:', !!newSession?.user);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.debug('🚪 useAuthSession: signing out');
    await supabase.auth.signOut();
  };

  return {
    session,
    user,
    loading,
    authReady,
    signOut,
  };
};

