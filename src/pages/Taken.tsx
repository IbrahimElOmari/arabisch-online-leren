
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

const Taken = () => {
  const { user, authReady, loading: authLoading } = useAuth();

  // Auth loading gate
  if (authLoading && !authReady) {
    return <FullPageLoader text="Laden..." />;
  }

  // Redirect if no user
  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Taken</h1>
        <div className="main-content-card">
          <p className="text-muted-foreground">
            De taken pagina wordt binnenkort beschikbaar gesteld.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Taken;
