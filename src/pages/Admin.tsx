import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useUserRole } from '@/hooks/useUserRole';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { FeatureFlagsPanel } from '@/components/admin/FeatureFlagsPanel';
import { AuditViewer } from '@/components/admin/AuditViewer';
import { NotificationsPanel } from '@/components/admin/NotificationsPanel';
import { SystemHealthIndicator } from '@/components/admin/SystemHealthIndicator';

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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">System monitoring & management</p>
          </div>
          <div className="flex items-center gap-4">
            <SystemHealthIndicator />
            <NotificationsPanel />
          </div>
        </div>
        
        <AdminDashboard />
        
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureFlagsPanel />
          <AuditViewer />
        </div>
      </div>
    </div>
  );
};

export default Admin;
