
import { useAuth } from '@/components/auth/AuthProvider';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';

const Dashboard = () => {
  const { user, profile } = useAuth();

  console.debug('📊 Dashboard: user:', !!user, 'profile:', !!profile, 'role:', profile?.role);

  // Show skeleton while profile is loading
  if (!profile) {
    console.debug('⏳ Dashboard: Profile not loaded yet, showing skeleton');
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-6 w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
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
