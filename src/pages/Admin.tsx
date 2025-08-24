
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

const Admin = () => {
  const { user, profile, authReady, loading: authLoading } = useAuth();

  // Auth loading gate
  if (authLoading && !authReady) {
    return <FullPageLoader text="Laden..." />;
  }

  // Redirect if no user
  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Check admin permission
  if (profile && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="main-content-card">
          <p className="text-muted-foreground">
            De admin dashboard wordt binnenkort beschikbaar gesteld.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
