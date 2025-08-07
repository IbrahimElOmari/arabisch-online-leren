
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-lg">Laden...</div>
    </div>
  );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'leerkracht':
      return <TeacherDashboard />;
    case 'leerling':
      return <StudentDashboard />;
    default:
      return <Navigate to="/auth" replace />;
  }
};

export default Dashboard;
