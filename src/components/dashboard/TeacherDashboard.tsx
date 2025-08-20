
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import TaskQuestionManagementNew from '@/components/management/TaskQuestionManagementNew';
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
  Plus
} from 'lucide-react';

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

  // Local state to control modals
  const [teachingOpen, setTeachingOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchClasses();
    }
  }, [profile?.id]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      console.debug('Fetching classes for teacher:', profile?.id);

      const { data, error } = await supabase
        .from('klassen')
        .select('*')
        .eq('teacher_id', profile?.id);

      if (error) throw error;

      console.debug('Classes loaded:', data);
      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
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
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-4">Geen klassen toegewezen</h2>
              <p className="text-muted-foreground mb-4">
                Er zijn nog geen klassen aan jou toegewezen. Neem contact op met de admin.
              </p>
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
            Welkom, {profile?.full_name}!
          </h1>
          <p className="text-muted-foreground">
            Hier vind je een overzicht van je klassen en lesmateriaal.
          </p>
        </div>

        {/* Class Selection */}
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

        {/* Main Content Tabs */}
        {selectedClass && (
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Taken & Vragen
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
                </CardHeader>
                <CardContent>
                  <TaskQuestionManagementNew />
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
