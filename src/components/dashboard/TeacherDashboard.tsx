
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import TaskQuestionManagementNew from '@/components/management/TaskQuestionManagementNew';
import { TeacherGradingPanel } from '@/components/teacher/TeacherGradingPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TeachingModal } from '@/components/teaching/TeachingModal';
import { AttendanceModal } from '@/components/teaching/AttendanceModal';
import { PerformanceModal } from '@/components/teaching/PerformanceModal';
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  FileText,
  BarChart3,
  Clock,
  Plus,
  AlertTriangle,
  CheckSquare
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Class {
  id: string;
  name: string;
  description: string | null;
}

const TeacherDashboard = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [teachingOpen, setTeachingOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchClasses();
    }
  }, [profile?.id]);

  const fetchClasses = async () => {
    console.debug('🔄 TeacherDashboard: Starting class fetch');
    setLoading(true);
    setError(null);

    try {
      console.debug('Fetching classes for teacher:', profile?.id);

      const controller = new AbortController();
      const timer = setTimeout(() => {
        console.warn('⚠️ TeacherDashboard: Aborting classes fetch after 4s');
        controller.abort();
      }, 4000);

      const { data, error } = await supabase
        .from('klassen')
        .select('*')
        .eq('teacher_id', profile?.id)
        .abortSignal(controller.signal);

      clearTimeout(timer);

      if (error) throw error;

      console.debug('Classes loaded:', data);
      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      } else {
        setSelectedClass(null);
      }

      console.debug('✅ TeacherDashboard: Classes fetched successfully');
    } catch (err: any) {
      console.error('❌ TeacherDashboard: Error fetching classes:', err);
      setError('Laden van klassen duurde te lang of mislukte. We tonen voorlopig een lege lijst. Probeer opnieuw.');
      setClasses([]);
      setSelectedClass(null);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedClassName = () => {
    const selectedClassObj = classes.find(c => c.id === selectedClass);
    return selectedClassObj?.name || '';
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

  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Kon klassen niet laden</AlertTitle>
              <AlertDescription className="flex items-center gap-3">
                {error}
                <Button variant="outline" size="sm" onClick={fetchClasses}>
                  Opnieuw proberen
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-4">Geen klassen beschikbaar</h2>
              <p className="text-muted-foreground mb-4">
                We konden geen klassen ophalen. Probeer het later opnieuw of klik op "Opnieuw proberen".
              </p>
              <Button onClick={fetchClasses}>
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
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verbindingsprobleem</AlertTitle>
            <AlertDescription className="flex items-center gap-3">
              {error}
              <Button variant="outline" size="sm" onClick={fetchClasses}>
                Opnieuw proberen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Welkom, {profile?.full_name}!
          </h1>
          <p className="text-muted-foreground">
            Hier vind je een overzicht van je klassen en lesmateriaal.
          </p>
        </div>

        <div className="grid gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mijn Klassen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {classes.map((klas) => (
                  <Button
                    key={klas.id}
                    variant={selectedClass === klas.id ? "default" : "outline"}
                    onClick={() => setSelectedClass(klas.id)}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    {klas.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedClass && (
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Maken
              </TabsTrigger>
              <TabsTrigger value="grading" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Beoordelen
              </TabsTrigger>
              <TabsTrigger value="teaching" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lesgeven
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Aanwezigheid
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Prestaties
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Beheer Taken & Vragen</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Maak nieuwe taken en vragen voor je studenten
                  </p>
                </CardHeader>
                <CardContent>
                  <TaskQuestionManagementNew />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grading" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Beoordeling & Feedback</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Bekijk en beoordeel inzendingen van je studenten
                  </p>
                </CardHeader>
                <CardContent>
                  <TeacherGradingPanel classId={selectedClass} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teaching" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lesgeven</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="mb-4 flex items-center gap-2"
                    onClick={() => setTeachingOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Nieuwe les
                  </Button>
                  <TeachingModal 
                    open={teachingOpen} 
                    onOpenChange={setTeachingOpen}
                    selectedClass={selectedClass}
                    type="youtube"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aanwezigheid</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="mb-4"
                    onClick={() => setAttendanceOpen(true)}
                  >
                    Aanwezigheid registreren
                  </Button>
                  <AttendanceModal 
                    open={attendanceOpen} 
                    onOpenChange={setAttendanceOpen}
                    classId={selectedClass}
                    className={getSelectedClassName()}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prestaties</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="mb-4"
                    onClick={() => setPerformanceOpen(true)}
                  >
                    Prestaties bekijken
                  </Button>
                  <PerformanceModal 
                    open={performanceOpen} 
                    onOpenChange={setPerformanceOpen}
                    classId={selectedClass}
                    className={getSelectedClassName()}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
