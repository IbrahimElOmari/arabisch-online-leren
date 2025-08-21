
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const { toast } = useToast();

  const createFallbackProfile = (userId: string, userData?: User): UserProfile => {
    console.debug('🔄 AuthProvider: Creating fallback profile for user:', userId);
    return {
      id: userId,
      full_name: userData?.user_metadata?.full_name || 'Gebruiker',
      role: (userData?.user_metadata?.role || 'leerling') as UserRole,
      parent_email: userData?.user_metadata?.parent_email
    };
  };

  const setProfileFailsafe = (userId: string, userData?: User) => {
    console.debug('⏰ AuthProvider: Setting profile failsafe for user:', userId);
    
    const timeout = setTimeout(() => {
      setProfile(current => {
        if (!current) {
          console.debug('🔄 AuthProvider: Applying failsafe profile');
          const fallbackProfile = createFallbackProfile(userId, userData);
          toast({
            title: "Profiel geladen via fallback",
            description: "Je profiel werd geladen met basis informatie.",
            variant: "default"
          });
          return fallbackProfile;
        }
        return current;
      });
    }, 2000);

    return timeout;
  };

  const fetchProfile = async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    console.debug('🔍 AuthProvider: Starting fetchProfile for userId:', userId, 'retry:', retryCount);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ AuthProvider: Profile fetch error:', error);
        
        if (retryCount < 2 && (error.code === 'PGRST301' || error.message.includes('network'))) {
          console.debug('🔄 AuthProvider: Retrying profile fetch in 1s...');
          return new Promise(resolve => {
            setTimeout(() => resolve(fetchProfile(userId, retryCount + 1)), 1000);
          });
        }
        
        // Get user data for fallback
        const { data: userData } = await supabase.auth.getUser();
        const fallbackProfile = createFallbackProfile(userId, userData.user || undefined);
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
      
      console.debug('✅ AuthProvider: Profile fetched successfully:', data);
      setProfile(data);
      return data;
      
    } catch (error) {
      console.error('❌ AuthProvider: Profile fetch exception:', error);
      
      if (retryCount < 2) {
        console.debug('🔄 AuthProvider: Retrying after exception...');
        return new Promise(resolve => {
          setTimeout(() => resolve(fetchProfile(userId, retryCount + 1)), 1000);
        });
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const fallbackProfile = createFallbackProfile(userId, userData.user || undefined);
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
    }
  };

  const refreshProfile = async () => {
    console.debug('🔄 AuthProvider: Manual refresh profile requested');
    if (user) {
      setProfile(null);
      
      // Get fresh user data
      const { data: userData } = await supabase.auth.getUser();
      
      // Start failsafe immediately
      const timeoutId = setProfileFailsafe(user.id, userData.user || undefined);
      
      try {
        const fetchedProfile = await fetchProfile(user.id);
        if (fetchedProfile) {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('❌ AuthProvider: Refresh profile failed:', error);
      }
    } else {
      console.debug('⚠️ AuthProvider: No user available for profile refresh');
      toast({
        title: "Geen gebruiker",
        description: "Kan profiel niet herladen - geen gebruiker ingelogd",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    console.debug('🚀 AuthProvider: Starting initialization');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.debug('🔄 AuthProvider: Auth state change event:', event, 'Session:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setAuthReady(true);
        
        if (session?.user) {
          console.debug('👤 AuthProvider: User authenticated, fetching profile');
          const timeoutId = setProfileFailsafe(session.user.id, session.user);
          const fetchedProfile = await fetchProfile(session.user.id);
          if (fetchedProfile) {
            clearTimeout(timeoutId);
          }
        } else {
          console.debug('🚫 AuthProvider: No user session, clearing profile');
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('❌ AuthProvider: Session check error:', error);
      }
      
      console.debug('📋 AuthProvider: Initial session check:', !!session);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setAuthReady(true);
      
      if (session?.user) {
        console.debug('👤 AuthProvider: Existing session found, fetching profile');
        const timeoutId = setProfileFailsafe(session.user.id, session.user);
        const fetchedProfile = await fetchProfile(session.user.id);
        if (fetchedProfile) {
          clearTimeout(timeoutId);
        }
      }
    });

    return () => {
      console.debug('🧹 AuthProvider: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.debug('🚪 AuthProvider: Signing out');
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch (error) {
      console.error('❌ AuthProvider: Sign out error:', error);
      toast({
        title: "Uitloggen mislukt",
        description: "Er ging iets mis bij het uitloggen. Probeer het opnieuw.",
        variant: "destructive"
      });
    }
  };

  console.debug('🔄 AuthProvider: Render state - loading:', loading, 'authReady:', authReady, 'user:', !!user, 'profile:', !!profile);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      authReady,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
