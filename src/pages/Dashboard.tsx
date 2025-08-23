
import { useAuth } from '@/components/auth/AuthProviderRefactored';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { BackendStatusBadge } from '@/components/status/BackendStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Dashboard = () => {
  const { user, profile, authReady, loading, refreshProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.debug('📊 Dashboard: user:', !!user, 'profile:', !!profile, 'role:', profile?.role);

  const handleRefresh = async () => {
    console.debug('🔄 Dashboard: Manual refresh requested');
    setIsRefreshing(true);
    
    try {
      await refreshProfile();
    } catch (error) {
      console.error('❌ Dashboard: Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Early guard: if auth is ready and no user, redirect to auth
  if (authReady && !user) {
    console.debug('🚫 Dashboard: No user after auth ready, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // Show loading while auth isn't ready
  if (!authReady && loading) {
    console.debug('⏳ Dashboard: Auth not ready yet');
    return <FullPageLoader text="Authenticatie controleren..." />;
  }

  // If we have a profile, render the appropriate dashboard
  if (profile) {
    console.debug('✅ Dashboard: Rendering dashboard for role:', profile.role);
    
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'leerkracht':
        return <TeacherDashboard />;
      case 'leerling':
        return <StudentDashboard />;
      default:
        console.error('❌ Dashboard: Unknown role:', profile.role);
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-lg text-destructive">
              Onbekende gebruikersrol: {profile.role}
            </div>
          </div>
        );
    }
  }

  // Fallback dashboard when profile is loading
  if (user) {
    console.debug('🔄 Dashboard: User available but no profile, showing fallback');
    const fallbackRole = user.user_metadata?.role || 'leerling';
    
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Welkom! Je profiel wordt geladen...
                </p>
              </div>
              <BackendStatusBadge compact />
            </div>
            
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Profiel wordt geladen</AlertTitle>
              <AlertDescription className="flex items-center gap-3">
                Je dashboard werkt met basis functionaliteit terwijl je profiel wordt geladen.
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Bezig...' : 'Forceer profiel'}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Basic fallback dashboard content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-2">Welkom!</h3>
              <p className="text-muted-foreground">
                Je dashboard wordt volledig geladen zodra je profiel beschikbaar is.
                Momenteel werken we met rol: <strong>{fallbackRole}</strong>
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-2">Navigatie</h3>
              <p className="text-muted-foreground">
                Je kunt al wel naar andere pagina's navigeren via de sidebar.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Final fallback - should rarely be reached
  console.debug('⏳ Dashboard: No user yet, showing loading');
  return <FullPageLoader text="Laden..." />;
};

export default Dashboard;
