import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useUserRole } from '@/hooks/useUserRole';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { FeatureFlagsPanel } from '@/components/admin/FeatureFlagsPanel';
import { AuditViewer } from '@/components/admin/AuditViewer';
import { NotificationsPanel } from '@/components/admin/NotificationsPanel';
import { SystemHealthIndicator } from '@/components/admin/SystemHealthIndicator';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { user, authReady, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleGlobalRefresh = () => {
    queryClient.invalidateQueries();
    toast({
      title: 'Dashboard vernieuwd',
      description: 'Alle gegevens zijn opnieuw geladen',
    });
  };

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
            <Button variant="outline" size="icon" onClick={handleGlobalRefresh} title="Vernieuwen">
              <RefreshCw className="h-4 w-4" />
            </Button>
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
