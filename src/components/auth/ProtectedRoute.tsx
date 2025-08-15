
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, authReady, loading } = useAuth();

  console.debug('🛡️ ProtectedRoute: authReady:', authReady, 'user present:', !!user, 'loading:', loading);

  // Show loading spinner while auth is initializing
  if (!authReady || loading) {
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
