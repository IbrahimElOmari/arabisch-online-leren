
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

  // Failsafe: if authReady is true but loading is stuck, unlock after 3 seconds
  useEffect(() => {
    if (authReady && loading && !forceUnlock) {
      console.debug('⏰ ProtectedRoute: Setting unlock timeout (3s) because authReady but loading is stuck');
      const timeout = setTimeout(() => {
        console.debug('🔓 ProtectedRoute: Force unlocking due to timeout');
        setForceUnlock(true);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [authReady, loading, forceUnlock]);

  // Show loading spinner while auth is initializing, but only if not force unlocked
  if ((!authReady || loading) && !forceUnlock) {
    console.debug('⏳ ProtectedRoute: Auth not ready, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    console.debug('🚫 ProtectedRoute: No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.debug('✅ ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};
