import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import UserActivationPanel from '@/components/admin/UserActivationPanel';
import { PendingUsersManagement } from '@/components/admin/PendingUsersManagement';
import AdminSeeder from '@/components/admin/AdminSeeder';
import { ClassManagementModal } from '@/components/admin/ClassManagementModal';
import {
  Users,
  GraduationCap,
  Settings,
  Shield,
  BookOpen,
  UserCheck,
  Clock,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BackendStatusBadge } from '@/components/status/BackendStatusBadge';

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
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const withTimeout = async <T,>(fn: (signal: AbortSignal) => Promise<T>, label: string, ms = 4000): Promise<T | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fn(controller.signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setWarnings(prev => [...prev, `${label}: time-out na ${ms / 1000}s`]);
      } else {
        setWarnings(prev => [...prev, `${label}: ${err?.message || 'fout'}`]);
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const fetchDashboardData = async () => {
    console.debug('🔄 AdminDashboard: Starting data fetch');
    setLoading(true);
    setWarnings([]);

    // Users count
    const users = await withTimeout(async (signal) => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .abortSignal(signal);
      if (error) throw error;
      return count ?? 0;
    }, 'Gebruikers');

    setUserCount(users ?? 0);

    // Pending users
    const pending = await withTimeout(async (signal) => {
      const { data: allStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'leerling')
        .abortSignal(signal);

      if (studentsError) throw studentsError;

      if (!allStudents || allStudents.length === 0) return 0;
      const studentIds = allStudents.map(s => s.id);

      const { data: paidEnrollments, error: enrollError } = await supabase
        .from('inschrijvingen')
        .select('student_id')
        .in('student_id', studentIds)
        .eq('payment_status', 'paid')
        .abortSignal(signal);

      if (enrollError) throw enrollError;

      const paidStudentIds = new Set(paidEnrollments?.map(e => e.student_id) || []);
      return studentIds.filter(id => !paidStudentIds.has(id)).length;
    }, 'Nieuwe aanvragen');

    setPendingUserCount(pending ?? 0);

    // Class count
    const classes = await withTimeout(async (signal) => {
      const { count, error } = await supabase
        .from('klassen')
        .select('*', { count: 'exact', head: true })
        .abortSignal(signal);
      if (error) throw error;
      return count ?? 0;
    }, 'Klassen');

    setClassCount(classes ?? 0);

    // Task count
    const tasks = await withTimeout(async (signal) => {
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .abortSignal(signal);
      if (error) throw error;
      return count ?? 0;
    }, 'Taken');

    setTaskCount(tasks ?? 0);

    // Lesson count
    const lessons = await withTimeout(async (signal) => {
      const { count, error } = await supabase
        .from('lessen')
        .select('*', { count: 'exact', head: true })
        .abortSignal(signal);
      if (error) throw error;
      return count ?? 0;
    }, 'Lessen');

    setLessonCount(lessons ?? 0);

    console.debug('✅ AdminDashboard: Data fetch completed (with fail-open)');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Overzicht van de school administratie.
            </p>
          </div>
          <BackendStatusBadge compact />
        </div>

        {warnings.length > 0 && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verbindingsproblemen</AlertTitle>
            <AlertDescription>
              {warnings.join(' • ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics grid always visible; show 0 or skeletons while loading */}
        <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gebruikers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? 0 : userCount}</div>
              <p className="text-xs text-muted-foreground">Aantal geregistreerde gebruikers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nieuwe aanvragen</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? 0 : pendingUserCount}</div>
              <p className="text-xs text-muted-foreground">Gebruikers in afwachting van activatie</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Klassen</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? 0 : classCount}</div>
              <p className="text-xs text-muted-foreground">Aantal aangemaakte klassen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taken</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? 0 : taskCount}</div>
              <p className="text-xs text-muted-foreground">Aantal beschikbare taken</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lessen</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? 0 : lessonCount}</div>
              <p className="text-xs text-muted-foreground">Aantal geplande lessen</p>
            </CardContent>
          </Card>
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
