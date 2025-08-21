
import { useAuth } from '@/components/auth/AuthProvider';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

const Dashboard = () => {
  const { user, profile, authReady, refreshProfile } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileTimeout, setProfileTimeout] = useState(false);

  console.debug('📊 Dashboard: user:', !!user, 'profile:', !!profile, 'role:', profile?.role);

  // Set a timeout to show fallback dashboard if profile takes too long
  useEffect(() => {
    if (authReady && user && !profile) {
      const timeoutId = setTimeout(() => {
        console.debug('⏰ Dashboard: Profile timeout reached, showing fallback');
        setShowFallback(true);
        setProfileTimeout(true);
      }, 2000);

      return () => clearTimeout(timeoutId);
    } else if (profile) {
      setShowFallback(false);
      setProfileTimeout(false);
    }
  }, [authReady, user, profile]);

  const handleRefresh = async () => {
    console.debug('🔄 Dashboard: Manual refresh requested');
    setIsRefreshing(true);
    setShowFallback(false);
    setProfileTimeout(false);
    
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
  if (!authReady) {
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

  // Profile timeout reached - show fallback dashboard
  if (showFallback && user) {
    console.debug('🔄 Dashboard: Showing fallback dashboard based on user metadata');
    const fallbackRole = user.user_metadata?.role || 'leerling';
    
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              Dashboard ({fallbackRole})
            </h1>
            <p className="text-muted-foreground">
              Je profiel wordt nog geladen...
            </p>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Profiel herladen...' : 'Profiel herladen'}
            </Button>
          </div>
          
          {/* Basic fallback dashboard content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-2">Welkom!</h3>
              <p className="text-muted-foreground">
                Je dashboard wordt geladen zodra je profiel beschikbaar is.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Still waiting for profile
  console.debug('⏳ Dashboard: Waiting for profile, showing loading with retry');
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <FullPageLoader text="Profiel laden..." />
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-4"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Bezig...' : 'Opnieuw proberen'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
