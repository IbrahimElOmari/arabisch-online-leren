import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';

const Admin = () => {
  const { user, authReady, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  // Auth loading gate
  if (authLoading && !authReady) {
    return <FullPageLoader text="Laden..." />;
  }

  // Role loading gate
  if (roleLoading) {
    return <FullPageLoader text="Toegang controleren..." />;
  }

  // Redirect if no user
  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Check admin permission using RBAC
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <Card className="@container">
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              De admin dashboard wordt binnenkort beschikbaar gesteld.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
