
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'leerkracht' | 'leerling';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  parent_email?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  profileSyncing: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProviderEnhanced = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [profileSyncing, setProfileSyncing] = useState(false);

  const fetchProfileWithTimeout = async (userId: string, timeout = 3000) => {
    console.debug('🔍 AuthProvider: Starting fetchProfileWithTimeout for userId:', userId);
    setProfileSyncing(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeoutId);

      if (error) {
        console.error('❌ AuthProvider: Profile fetch error:', error);
        throw error;
      }

      console.debug('✅ AuthProvider: Profile fetched successfully:', data);
      setProfile(data);
      setProfileSyncing(false);
      return data;
    } catch (error: any) {
      console.error('❌ AuthProvider: Profile fetch failed:', error);
      
      // Fallback to user metadata
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.user_metadata) {
        console.debug('🔄 AuthProvider: Using fallback profile from metadata');
        const fallbackProfile = {
          id: userId,
          full_name: userData.user.user_metadata.full_name || 'Gebruiker',
          role: (userData.user.user_metadata.role || 'leerling') as UserRole,
          parent_email: userData.user.user_metadata.parent_email
        };
        setProfile(fallbackProfile);
        
        // Start background retry
        setTimeout(() => {
          console.debug('🔄 AuthProvider: Starting background profile retry');
          fetchProfileWithTimeout(userId, 5000).catch(console.error);
        }, 5000);
      }
      setProfileSyncing(false);
    }
  };

  useEffect(() => {
    console.debug('🚀 AuthProvider: Starting enhanced initialization');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.debug('🔄 AuthProvider: Auth state change event:', event, 'Session:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setAuthReady(true);
        
        if (session?.user) {
          await fetchProfileWithTimeout(session.user.id);
        } else {
          setProfile(null);
          setProfileSyncing(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.debug('📋 AuthProvider: Initial session check:', !!session);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setAuthReady(true);
      
      if (session?.user) {
        await fetchProfileWithTimeout(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    console.debug('🚪 AuthProvider: Signing out');
    await supabase.auth.signOut();
    setProfile(null);
    setProfileSyncing(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      authReady,
      profileSyncing,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
