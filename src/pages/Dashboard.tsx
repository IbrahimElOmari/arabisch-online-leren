
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

  console.debug('📊 Dashboard: user:', !!user, 'profile:', !!profile, 'role:', profile?.role);

  // Set a timeout to show fallback dashboard if profile takes too long
  useEffect(() => {
    if (authReady && user && !profile) {
      const timeoutId = setTimeout(() => {
        console.debug('⏰ Dashboard: Profile timeout reached, showing fallback');
        setShowFallback(true);
      }, 3000);

      return () => clearTimeout(timeoutId);
    } else {
      setShowFallback(false);
    }
  }, [authReady, user, profile]);

  // Early guard: if auth is ready and no user, redirect to auth
  if (authReady && !user) {
    console.debug('🚫 Dashboard: No user after auth ready, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // Show loading while profile is being fetched or auth isn't ready
  if (!authReady) {
    console.debug('⏳ Dashboard: Auth not ready yet');
    return <FullPageLoader text="Authenticatie controleren..." />;
  }

  // If user exists but profile is still null after auth is ready
  if (authReady && user && !profile && !showFallback) {
    console.debug('⚠️ Dashboard: User exists but profile not loaded, showing loading with retry');
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <FullPageLoader text="Profiel laden..." />
            <Button 
              variant="outline" 
              onClick={refreshProfile}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Opnieuw proberen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback dashboard if profile loading takes too long
  if (authReady && user && !profile && showFallback) {
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
              onClick={refreshProfile}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Profiel herladen
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
};

export default Dashboard;
