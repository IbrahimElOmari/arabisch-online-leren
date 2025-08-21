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

  // Failsafe timeout for profile loading
  const [profileTimeout, setProfileTimeout] = useState<NodeJS.Timeout | null>(null);

  const createFallbackProfile = (userId: string, userData?: any): UserProfile => {
    console.debug('🔄 AuthProvider: Creating fallback profile for user:', userId);
    return {
      id: userId,
      full_name: userData?.user_metadata?.full_name || 'Gebruiker',
      role: (userData?.user_metadata?.role || 'leerling') as UserRole,
      parent_email: userData?.user_metadata?.parent_email
    };
  };

  const fetchProfile = async (userId: string, retryCount = 0): Promise<void> => {
    console.debug('🔍 AuthProvider: Starting fetchProfile for userId:', userId, 'retry:', retryCount);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ AuthProvider: Profile fetch error:', error);
        
        // Retry logic voor transient errors
        if (retryCount < 2 && (error.code === 'PGRST301' || error.message.includes('network'))) {
          console.debug('🔄 AuthProvider: Retrying profile fetch in 1s...');
          setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
          return;
        }
        
        // Fallback naar user metadata
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          console.debug('🔄 AuthProvider: Using fallback profile from metadata');
          const fallbackProfile = createFallbackProfile(userId, userData);
          setProfile(fallbackProfile);
        } else {
          // Als laatste fallback, maak een basis profiel
          console.debug('🔄 AuthProvider: Using basic fallback profile');
          const basicProfile = createFallbackProfile(userId);
          setProfile(basicProfile);
          
          toast({
            title: "Profiel laden mislukt",
            description: "Er ging iets mis bij het laden van je profiel. Een basis profiel wordt gebruikt.",
            variant: "destructive"
          });
        }
        return;
      }
      
      console.debug('✅ AuthProvider: Profile fetched successfully:', data);
      setProfile(data);
      
    } catch (error) {
      console.error('❌ AuthProvider: Profile fetch exception:', error);
      
      if (retryCount < 2) {
        console.debug('🔄 AuthProvider: Retrying after exception...');
        setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
      } else {
        // Als laatste redmiddel, maak een fallback profile
        const basicProfile = createFallbackProfile(userId);
        setProfile(basicProfile);
        
        toast({
          title: "Verbindingsprobleem",
          description: "Kan geen verbinding maken met de server. Een basis profiel wordt gebruikt.",
          variant: "destructive"
        });
      }
    }
  };

  const refreshProfile = async () => {
    console.debug('🔄 AuthProvider: Manual refresh profile requested');
    if (user) {
      setProfile(null); // Clear current profile
      await fetchProfile(user.id);
      // Also trigger the failsafe to ensure we get a profile
      setProfileFailsafe(user.id);
    } else {
      console.debug('⚠️ AuthProvider: No user available for profile refresh');
      toast({
        title: "Geen gebruiker",
        description: "Kan profiel niet herladen - geen gebruiker ingelogd",
        variant: "destructive"
      });
    }
  };

  // Failsafe: set fallback profile after 2 seconds if no profile loaded
  const setProfileFailsafe = async (userId: string) => {
    if (profileTimeout) {
      clearTimeout(profileTimeout);
    }
    
    const timeout = setTimeout(async () => {
      if (!profile) {
        console.debug('⚠️ AuthProvider: Profile timeout reached, setting fallback profile');
        try {
          const { data: userData } = await supabase.auth.getUser();
          const fallbackProfile = createFallbackProfile(userId, userData?.user);
          setProfile(fallbackProfile);
          
          toast({
            title: "Profiel geladen via fallback",
            description: "Je profiel werd geladen met basis informatie.",
            variant: "default"
          });
        } catch (error) {
          console.error('❌ AuthProvider: Fallback profile creation failed:', error);
          const basicProfile = createFallbackProfile(userId);
          setProfile(basicProfile);
        }
      }
    }, 2000);
    
    setProfileTimeout(timeout);
  };

  useEffect(() => {
    console.debug('🚀 AuthProvider: Starting initialization');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.debug('🔄 AuthProvider: Auth state change event:', event, 'Session:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set authReady immediately for better UX
        setLoading(false);
        setAuthReady(true);
        
        if (session?.user) {
          console.debug('👤 AuthProvider: User authenticated, fetching profile');
          await fetchProfile(session.user.id);
          // Start failsafe timer
          setProfileFailsafe(session.user.id);
        } else {
          console.debug('🚫 AuthProvider: No user session, clearing profile');
          setProfile(null);
          if (profileTimeout) {
            clearTimeout(profileTimeout);
            setProfileTimeout(null);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('❌ AuthProvider: Session check error:', error);
        toast({
          title: "Sessie probleem",
          description: "Er ging iets mis bij het controleren van je sessie.",
          variant: "destructive"
        });
      }
      
      console.debug('📋 AuthProvider: Initial session check:', !!session);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      setLoading(false);
      setAuthReady(true);
      
      if (session?.user) {
        console.debug('👤 AuthProvider: Existing session found, fetching profile');
        await fetchProfile(session.user.id);
        // Start failsafe timer
        setProfileFailsafe(session.user.id);
      }
    });

    return () => {
      console.debug('🧹 AuthProvider: Cleaning up subscription');
      subscription.unsubscribe();
      if (profileTimeout) {
        clearTimeout(profileTimeout);
      }
    };
  }, []);

  const signOut = async () => {
    console.debug('🚪 AuthProvider: Signing out');
    try {
      if (profileTimeout) {
        clearTimeout(profileTimeout);
        setProfileTimeout(null);
      }
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
