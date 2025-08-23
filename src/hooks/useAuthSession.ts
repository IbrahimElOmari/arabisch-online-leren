
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    console.debug('🚀 useAuthSession: Starting session management');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.debug('🔄 useAuthSession: Auth state change:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setAuthReady(true);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ useAuthSession: Initial session error:', error);
      }
      console.debug('📋 useAuthSession: Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setAuthReady(true);
    });

    return () => {
      console.debug('🧹 useAuthSession: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.debug('🚪 useAuthSession: Signing out');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ useAuthSession: Sign out error:', error);
      throw error;
    }
  };

  return {
    user,
    session,
    loading,
    authReady,
    signOut
  };
};
