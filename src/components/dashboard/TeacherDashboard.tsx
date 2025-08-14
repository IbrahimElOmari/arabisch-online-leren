import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  BookOpen, 
  Users, 
  Video, 
  FileQuestion, 
  Calendar, 
  Upload, 
  CheckSquare, 
  ClipboardList,
  UserCheck,
  Plus,
  GraduationCap,
  Settings,
  Bell,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { WelcomeWidget } from './WelcomeWidget';
import { TeacherStats } from './TeacherStats';
import { supabase } from '@/integrations/supabase/client';
import { TeachingModal } from '@/components/teaching/TeachingModal';
import PastLessonsManager from '@/components/lessons/PastLessonsManager';
import { GradingInterface } from '@/components/teacher/GradingInterface';
import TaskQuestionManagementNew from '@/components/management/TaskQuestionManagementNew';
import ForumModerationQueue from '@/components/forum/ForumModerationQueue';

interface ClassData {
  id: string;
  name: string;
  description: string;
  teacher_id: string | null;
}

interface Level {
  id: string;
  name: string;
  description: string;
}

const TeacherDashboard = () => {
  const { signOut, profile } = useAuth();
  const [klassen, setKlassen] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [niveaus, setNiveaus] = useState<any[]>([]);

  const levels: Level[] = [
    { id: 'level-1', name: 'Niveau 1', description: 'Basis Arabisch' },
    { id: 'level-2', name: 'Niveau 2', description: 'Voortgezet Beginners' },
    { id: 'level-3', name: 'Niveau 3', description: 'Intermediate' },
    { id: 'level-4', name: 'Niveau 4', description: 'Gevorderd' }
  ];

  useEffect(() => {
    fetchKlassen();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchNiveaus();
    }
  }, [selectedClass]);

  const fetchKlassen = async () => {
    try {
      const { data, error } = await supabase
        .from('klassen')
        .select('*')
        .eq('teacher_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKlassen(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
        setSelectedLevel('level-1');
      }
    } catch (error) {
      console.error('Error fetching klassen:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNiveaus = async () => {
    try {
      const { data, error } = await supabase
        .from('niveaus')
        .select('*')
        .eq('class_id', selectedClass)
        .order('niveau_nummer', { ascending: true });

      if (error) throw error;
      setNiveaus(data || []);
    } catch (error) {
      console.error('Error fetching niveaus:', error);
    }
  };

  const getCurrentNiveauId = () => {
    const levelNumber = parseInt(selectedLevel.split('-')[1]);
    return niveaus.find(n => n.niveau_nummer === levelNumber)?.id || null;
  };

  const getRecentActivity = () => {
    return "Nieuwe les 'Arabische Grammatica' geüpload voor Niveau 2.";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  const selectedClassName = klassen.find(c => c.id === selectedClass)?.name || '';
  const selectedLevelName = levels.find(l => l.id === selectedLevel)?.name || '';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leerkracht Dashboard</h1>
            <p className="text-muted-foreground">Welkom, {profile?.full_name}</p>
          </div>
          <Button onClick={signOut} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Uitloggen
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-8">
          {/* Teacher Stats */}
          <TeacherStats
            totalStudents={45}
            activeClasses={3}
            completedLessons={28}
            totalLessons={40}
            averageEngagement={87}
          />

          <WelcomeWidget recentActivity={getRecentActivity()} />

          <Tabs defaultValue="teaching" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="teaching" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Lesgeven
              </TabsTrigger>
              <TabsTrigger value="grading" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Beoordelen
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Beheer
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Communicatie
              </TabsTrigger>
              <TabsTrigger value="forum" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Forum
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Instellingen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="teaching" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Klas- en Niveauselectie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Selecteer Klas</label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kies een klas" />
                        </SelectTrigger>
                        <SelectContent>
                          {klassen.map((klas) => (
                            <SelectItem key={klas.id} value={klas.id}>
                              {klas.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Selecteer Niveau</label>
                      <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kies een niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedClass && selectedLevel && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">
                        Actief: <Badge variant="outline">{selectedClassName} - {selectedLevelName}</Badge>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedClass && selectedLevel && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Lesbeheer - {selectedLevelName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <TeachingModal
                          selectedClass={selectedClass}
                          selectedLevel={selectedLevel}
                          type="youtube"
                          niveauId={getCurrentNiveauId()}
                          trigger={
                            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                              <Video className="h-5 w-5" />
                              <span className="text-xs">YouTube Link</span>
                            </Button>
                          }
                        />

                        <TeachingModal
                          selectedClass={selectedClass}
                          selectedLevel={selectedLevel}
                          type="questions"
                          niveauId={getCurrentNiveauId()}
                          trigger={
                            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                              <FileQuestion className="h-5 w-5" />
                              <span className="text-xs">Vragen Opstellen</span>
                            </Button>
                          }
                        />

                        <TeachingModal
                          selectedClass={selectedClass}
                          selectedLevel={selectedLevel}
                          type="schedule"
                          niveauId={getCurrentNiveauId()}
                          trigger={
                            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                              <Calendar className="h-5 w-5" />
                              <span className="text-xs">Live Les Plannen</span>
                            </Button>
                          }
                        />

                        <TeachingModal
                          selectedClass={selectedClass}
                          selectedLevel={selectedLevel}
                          type="upload"
                          niveauId={getCurrentNiveauId()}
                          trigger={
                            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                              <Upload className="h-5 w-5" />
                              <span className="text-xs">Opname Uploaden</span>
                            </Button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        Evaluatie - {selectedLevelName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <TeachingModal
                          selectedClass={selectedClass}
                          selectedLevel={selectedLevel}
                          type="questions"
                          niveauId={getCurrentNiveauId()}
                          trigger={
                            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                              <FileQuestion className="h-5 w-5" />
                              <span className="text-xs">Open Vragen</span>
                            </Button>
                          }
                        />

                        <TeachingModal
                          selectedClass={selectedClass}
                          selectedLevel={selectedLevel}
                          type="task"
                          niveauId={getCurrentNiveauId()}
                          trigger={
                            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                              <Plus className="h-5 w-5" />
                              <span className="text-xs">Nieuwe Taak</span>
                            </Button>
                          }
                        />

                        <TeachingModal
                          selectedClass={selectedClass}
                          selectedLevel={selectedLevel}
                          type="attendance"
                          niveauId={getCurrentNiveauId()}
                          trigger={
                            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                              <UserCheck className="h-5 w-5" />
                              <span className="text-xs">Aanwezigheid</span>
                            </Button>
                          }
                        />

                        <TeachingModal
                          selectedClass={selectedClass}
                          selectedLevel={selectedLevel}
                          type="performance"
                          niveauId={getCurrentNiveauId()}
                          trigger={
                            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                              <ClipboardList className="h-5 w-5" />
                              <span className="text-xs">Prestaties</span>
                            </Button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Voorbije Lessen - {selectedLevelName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PastLessonsManager 
                        classId={selectedClass} 
                        niveauId={getCurrentNiveauId()}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="grading" className="space-y-6">
              <GradingInterface />
            </TabsContent>

            <TabsContent value="management" className="space-y-6">
              <TaskQuestionManagementNew />
            </TabsContent>

            <TabsContent value="communication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Mededelingen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Hier komen de mededelingen voor de leerkracht.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forum" className="space-y-6">
              <ForumModerationQueue />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Accountinstellingen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Hier kan de leerkracht zijn accountinstellingen wijzigen.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
