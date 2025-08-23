
import { createContext, useContext } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useUserProfile, UserProfile } from '@/hooks/useUserProfile';

interface AuthContextType {
  user: ReturnType<typeof useAuthSession>['user'];
  session: ReturnType<typeof useAuthSession>['session'];
  profile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  profileSyncing: boolean;
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

export const AuthProviderRefactored = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading, authReady, signOut } = useAuthSession();
  const { profile, profileSyncing, refreshProfile } = useUserProfile(user);

  console.debug('🔄 AuthProviderRefactored: Render state - loading:', loading, 'authReady:', authReady, 'user:', !!user, 'profile:', !!profile);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      authReady,
      profileSyncing,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
