
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import UserActivationPanel from '@/components/admin/UserActivationPanel';
import { PendingUsersManagement } from '@/components/admin/PendingUsersManagement';
import AdminSeeder from '@/components/admin/AdminSeeder';
import { ClassManagementModal } from '@/components/admin/ClassManagementModal';
import {
  Users,
  GraduationCap,
  Settings,
  Database,
  Shield,
  BarChart3,
  BookOpen,
  UserCheck,
  Clock,
  Plus
} from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
}

// Simplified component to avoid deep type instantiation
const DashboardCard = ({ title, value, icon, description }: DashboardCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [userCount, setUserCount] = useState<number>(0);
  const [pendingUserCount, setPendingUserCount] = useState<number>(0);
  const [classCount, setClassCount] = useState<number>(0);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [lessonCount, setLessonCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    console.debug('🔄 AdminDashboard: Starting data fetch');
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ AdminDashboard: Fetch timeout after 5 seconds');
      setLoading(false);
      setError('Data loading timed out. Please refresh the page.');
    }, 5000);

    try {
      setLoading(true);
      setError(null);

      // Fetch total user count - simplified query
      console.debug('📊 AdminDashboard: Fetching user count');
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('❌ AdminDashboard: User count error:', usersError);
        throw usersError;
      }
      setUserCount(totalUsers || 0);

      // Fetch pending users using the same logic as PendingUsersManagement
      console.debug('📊 AdminDashboard: Fetching pending users');
      const { data: allStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'leerling');

      if (studentsError) {
        console.error('❌ AdminDashboard: Students fetch error:', studentsError);
        throw studentsError;
      }

      // Count students without paid enrollments
      let pendingCount = 0;
      if (allStudents && allStudents.length > 0) {
        const studentIds = allStudents.map(s => s.id);
        
        const { data: paidEnrollments, error: enrollError } = await supabase
          .from('inschrijvingen')
          .select('student_id')
          .in('student_id', studentIds)
          .eq('payment_status', 'paid');

        if (enrollError) {
          console.error('❌ AdminDashboard: Enrollments fetch error:', enrollError);
          throw enrollError;
        }

        const paidStudentIds = new Set(paidEnrollments?.map(e => e.student_id) || []);
        pendingCount = studentIds.filter(id => !paidStudentIds.has(id)).length;
      }
      setPendingUserCount(pendingCount);

      // Fetch class count
      console.debug('📊 AdminDashboard: Fetching class count');
      const { count: totalClasses, error: classesError } = await supabase
        .from('klassen')
        .select('*', { count: 'exact', head: true });

      if (classesError) {
        console.error('❌ AdminDashboard: Classes count error:', classesError);
        throw classesError;
      }
      setClassCount(totalClasses || 0);

      // Fetch task count
      console.debug('📊 AdminDashboard: Fetching task count');
      const { count: totalTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      if (tasksError) {
        console.error('❌ AdminDashboard: Tasks count error:', tasksError);
        throw tasksError;
      }
      setTaskCount(totalTasks || 0);

      // Fetch lesson count
      console.debug('📊 AdminDashboard: Fetching lesson count');
      const { count: totalLessons, error: lessonsError } = await supabase
        .from('lessen')
        .select('*', { count: 'exact', head: true });

      if (lessonsError) {
        console.error('❌ AdminDashboard: Lessons count error:', lessonsError);
        throw lessonsError;
      }
      setLessonCount(totalLessons || 0);

      console.debug('✅ AdminDashboard: All data fetched successfully');
      clearTimeout(timeoutId);

    } catch (error) {
      console.error('❌ AdminDashboard: Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
      clearTimeout(timeoutId);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchDashboardData}>
                Opnieuw proberen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overzicht van de school administratie.
          </p>
        </div>

        <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Gebruikers"
            value={userCount}
            icon={<Users className="h-4 w-4 text-gray-500" />}
            description="Aantal geregistreerde gebruikers"
          />
          <DashboardCard
            title="Nieuwe aanvragen"
            value={pendingUserCount}
            icon={<UserCheck className="h-4 w-4 text-gray-500" />}
            description="Gebruikers in afwachting van activatie"
          />
          <DashboardCard
            title="Klassen"
            value={classCount}
            icon={<GraduationCap className="h-4 w-4 text-gray-500" />}
            description="Aantal aangemaakte klassen"
          />
           <DashboardCard
            title="Taken"
            value={taskCount}
            icon={<BookOpen className="h-4 w-4 text-gray-500" />}
            description="Aantal beschikbare taken"
          />
           <DashboardCard
            title="Lessen"
            value={lessonCount}
            icon={<Clock className="h-4 w-4 text-gray-500" />}
            description="Aantal geplande lessen"
          />
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gebruikers
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Nieuwe aanvragen
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Klassen
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gebruikersbeheer</CardTitle>
              </CardHeader>
              <CardContent>
                <UserActivationPanel />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Nieuwe Gebruikers</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingUsersManagement />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="classes" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Klassenbeheer</CardTitle>
                  <Button variant="outline" onClick={() => setClassModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nieuwe Klas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Content kan hier toegevoegd worden indien nodig */}
              </CardContent>
            </Card>
            <ClassManagementModal
              isOpen={classModalOpen}
              onClose={() => setClassModalOpen(false)}
            />
          </TabsContent>
          <TabsContent value="admin" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Tools</CardTitle>
                <CardContent>
                  <AdminSeeder />
                </CardContent>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
