
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, authReady, loading } = useAuth();
  const [forceUnlock, setForceUnlock] = useState(false);

  console.debug('🛡️ ProtectedRoute: authReady:', authReady, 'user present:', !!user, 'loading:', loading, 'forceUnlock:', forceUnlock);

  // More aggressive unlock: start timer when loading is true
  useEffect(() => {
    if (loading && !forceUnlock) {
      console.debug('⏰ ProtectedRoute: Setting unlock timeout (2s) because loading is true');
      const timeout = setTimeout(() => {
        console.debug('🔓 ProtectedRoute: Force unlocking due to timeout');
        setForceUnlock(true);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [loading, forceUnlock]);

  // If auth is ready and there's a user, show content (don't wait for profile)
  if (authReady && user) {
    console.debug('✅ ProtectedRoute: Auth ready with user, rendering children');
    return <>{children}</>;
  }

  // If auth is ready but no user, redirect
  if (authReady && !user) {
    console.debug('🚫 ProtectedRoute: Auth ready but no user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Force unlock after timeout
  if (forceUnlock && user) {
    console.debug('🔓 ProtectedRoute: Force unlocked with user, rendering children');
    return <>{children}</>;
  }

  if (forceUnlock && !user) {
    console.debug('🔓 ProtectedRoute: Force unlocked but no user, redirecting');
    return <Navigate to="/auth" replace />;
  }

  // Show loading only while auth is initializing
  console.debug('⏳ ProtectedRoute: Auth not ready, showing spinner');
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
};
