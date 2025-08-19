
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
// Removed Dialog imports since we manage modal open state locally
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

// Avoid React.FC to prevent deep type instantiation issues
function DashboardCard({ title, value, icon, description }: DashboardCardProps) {
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
}

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [pendingUserCount, setPendingUserCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [lessonCount, setLessonCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [classModalOpen, setClassModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user count
      const { count: users, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });
      if (usersError) throw usersError;
      setUserCount(users || 0);

      // Fetch pending user count
      const { count: pendingUsers, error: pendingUsersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');
      if (pendingUsersError) throw pendingUsersError;
      setPendingUserCount(pendingUsers || 0);

      // Fetch class count
      const { count: classes, error: classesError } = await supabase
        .from('klassen')
        .select('*', { count: 'exact' });
      if (classesError) throw classesError;
      setClassCount(classes || 0);

      // Fetch task count
      const { count: tasks, error: tasksError } = await supabase
        .from('tasks') // fixed table name
        .select('*', { count: 'exact' });
      if (tasksError) throw tasksError;
      setTaskCount(tasks || 0);

      // Fetch lesson count
       const { count: lessons, error: lessonsError } = await supabase
        .from('lessen')
        .select('*', { count: 'exact' });
      if (lessonsError) throw lessonsError;
      setLessonCount(lessons || 0);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
            {/* Render modal component with required props */}
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
