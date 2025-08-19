
import { useAuth } from '@/components/auth/AuthProvider';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, authReady, refreshProfile } = useAuth();

  console.debug('📊 Dashboard: user:', !!user, 'profile:', !!profile, 'role:', profile?.role);

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
  if (authReady && user && !profile) {
    console.debug('⚠️ Dashboard: User exists but profile not loaded, showing retry option');
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
