
import { createContext, useContext } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useUserProfileQuery, UserProfile } from '@/hooks/useUserProfileQuery';

interface AuthContextType {
  user: ReturnType<typeof useAuthSession>['user'];
  session: ReturnType<typeof useAuthSession>['session'];
  profile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
  isRefreshing: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProviderQuery = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading, authReady, signOut } = useAuthSession();
  const { profile, isLoading: profileLoading, refreshProfile, isRefreshing } = useUserProfileQuery(user);

  if (import.meta.env.DEV) {
    console.debug('🔄 AuthProviderQuery: user:', !!user, 'profile:', !!profile, 'profileLoading:', profileLoading);
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      authReady,
      profileLoading,
      signOut,
      refreshProfile,
      isRefreshing
    }}>
      {children}
    </AuthContext.Provider>
  );
};
