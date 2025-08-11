
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuth();

  console.debug('🛡️ ProtectedRoute: user present:', !!user);

  if (!user) {
    console.debug('🚫 ProtectedRoute: No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.debug('✅ ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};
