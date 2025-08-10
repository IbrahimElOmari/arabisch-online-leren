
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  console.debug('🛡️ ProtectedRoute: loading:', loading, 'user:', !!user);

  if (loading) {
    console.debug('⏳ ProtectedRoute: Still loading, showing loader');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
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
