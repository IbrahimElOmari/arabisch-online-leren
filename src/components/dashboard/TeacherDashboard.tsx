import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Users, 
  BookOpen, 
  Video, 
  Plus, 
  FileQuestion, 
  Calendar,
  Upload,
  CheckSquare,
  ClipboardList,
  UserCheck,
  MessageSquare,
  Play
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { WelcomeWidget } from './WelcomeWidget';
import { supabase } from '@/integrations/supabase/client';
import { TeachingModal } from '@/components/teaching/TeachingModal';
import { AttendanceModal } from '@/components/teaching/AttendanceModal';
import { PerformanceModal } from '@/components/teaching/PerformanceModal';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface AssignedClass {
  id: string;
  name: string;
  description: string;
}

interface Level {
  id: string;
  name: string;
  description: string;
}

const TeacherDashboard = () => {
  const { signOut, profile } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [niveaus, setNiveaus] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [videoModal, setVideoModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: ''
  });
  const [attendanceModal, setAttendanceModal] = useState<{ open: boolean; classId: string; className: string }>({
    open: false,
    classId: '',
    className: ''
  });
  const [performanceModal, setPerformanceModal] = useState<{ open: boolean; classId: string; className: string }>({
    open: false,
    classId: '',
    className: ''
  });

  const levels: Level[] = [
    { id: 'level-1', name: 'Niveau 1', description: 'Basis Arabisch' },
    { id: 'level-2', name: 'Niveau 2', description: 'Voortgezet Beginners' },
    { id: 'level-3', name: 'Niveau 3', description: 'Intermediate' },
    { id: 'level-4', name: 'Niveau 4', description: 'Gevorderd' }
  ];

  useEffect(() => {
    fetchAssignedClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchNiveaus();
      fetchLessons();
    }
  }, [selectedClass]);

  const fetchAssignedClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('klassen')
        .select('id, name, description')
        .eq('teacher_id', profile?.id);

      if (error) throw error;
      setAssignedClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
        setSelectedLevel('level-1');
      }
    } catch (error) {
      console.error('Error fetching assigned classes:', error);
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

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessen')
        .select('*')
        .eq('class_id', selectedClass)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const getCurrentNiveauId = () => {
    const levelNumber = parseInt(selectedLevel.split('-')[1]);
    return niveaus.find(n => n.niveau_nummer === levelNumber)?.id || null;
  };

  const handleVideoClick = (url: string, title: string) => {
    setVideoModal({ open: true, url, title });
  };

  const getRecentActivity = () => {
    return "Je hebt de aanwezigheid voor 'Les 3 (Niveau 2)' geregistreerd.";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  };

  if (assignedClasses.length === 0) {
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
          <WelcomeWidget recentActivity={getRecentActivity()} />
          
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Je bent nog niet toegewezen aan een klas. Neem contact op met de administrator.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const selectedClassName = assignedClasses.find(c => c.id === selectedClass)?.name || '';
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
        <WelcomeWidget recentActivity={getRecentActivity()} />

        <div className="space-y-6">
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
                      {assignedClasses.map((klas) => (
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
            <Tabs defaultValue="lessons" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="lessons">Lesbeheer</TabsTrigger>
                <TabsTrigger value="evaluation">Evaluatie & Opvolging</TabsTrigger>
                <TabsTrigger value="students">Leerlingoverzicht</TabsTrigger>
                <TabsTrigger value="forum">Forum</TabsTrigger>
              </TabsList>

              <TabsContent value="lessons" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Lesbeheer - {selectedLevelName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <TeachingModal
                        selectedClass={selectedClass}
                        selectedLevel={selectedLevel}
                        type="youtube"
                        niveauId={getCurrentNiveauId()}
                        trigger={
                          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                            <Video className="h-6 w-6" />
                            <span className="text-sm">YouTube Link Toevoegen</span>
                          </Button>
                        }
                      />

                      <TeachingModal
                        selectedClass={selectedClass}
                        selectedLevel={selectedLevel}
                        type="questions"
                        niveauId={getCurrentNiveauId()}
                        trigger={
                          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                            <FileQuestion className="h-6 w-6" />
                            <span className="text-sm">Vragen Opstellen</span>
                          </Button>
                        }
                      />

                      <TeachingModal
                        selectedClass={selectedClass}
                        selectedLevel={selectedLevel}
                        type="schedule"
                        niveauId={getCurrentNiveauId()}
                        trigger={
                          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                            <Calendar className="h-6 w-6" />
                            <span className="text-sm">Live Les Plannen</span>
                          </Button>
                        }
                      />

                      <TeachingModal
                        selectedClass={selectedClass}
                        selectedLevel={selectedLevel}
                        type="upload"
                        niveauId={getCurrentNiveauId()}
                        trigger={
                          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6" />
                            <span className="text-sm">Opname Uploaden</span>
                          </Button>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Huidige Lessen - {selectedLevelName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lessons.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Nog geen lessen aangemaakt
                        </div>
                      ) : (
                        lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Video className="h-5 w-5 text-primary" />
                              <div>
                                <h4 className="font-medium">{lesson.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Aangemaakt op {new Date(lesson.created_at).toLocaleDateString('nl-NL')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">Bewerken</Button>
                              {lesson.youtube_url && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleVideoClick(lesson.youtube_url, lesson.title)}
                                  className="flex items-center gap-1"
                                >
                                  <Play className="h-4 w-4" />
                                  Afspelen
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evaluation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      Evaluatie & Opvolging - {selectedLevelName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <TeachingModal
                        selectedClass={selectedClass}
                        selectedLevel={selectedLevel}
                        type="questions"
                        niveauId={getCurrentNiveauId()}
                        trigger={
                          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                            <FileQuestion className="h-6 w-6" />
                            <span className="text-sm">Open Vragen Beoordelen</span>
                          </Button>
                        }
                      />

                      <TeachingModal
                        selectedClass={selectedClass}
                        selectedLevel={selectedLevel}
                        type="task"
                        niveauId={getCurrentNiveauId()}
                        trigger={
                          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                            <Plus className="h-6 w-6" />
                            <span className="text-sm">Nieuwe Taak Aanmaken</span>
                          </Button>
                        }
                      />

                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center gap-2"
                        onClick={() => setAttendanceModal({ open: true, classId: selectedClass, className: selectedClassName })}
                      >
                        <UserCheck className="h-6 w-6" />
                        <span className="text-sm">Aanwezigheid Registreren</span>
                      </Button>

                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center gap-2"
                        onClick={() => setPerformanceModal({ open: true, classId: selectedClass, className: selectedClassName })}
                      >
                        <ClipboardList className="h-6 w-6" />
                        <span className="text-sm">Prestaties Bekijken</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Te Beoordelen - {selectedLevelName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium">Open vragen Les 2</h4>
                          <p className="text-sm text-muted-foreground">5 nieuwe antwoorden</p>
                        </div>
                        <Badge variant="destructive">Nieuw</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium">Spreektaak Week 3</h4>
                          <p className="text-sm text-muted-foreground">3 audio opnames</p>
                        </div>
                        <Badge variant="secondary">Te beoordelen</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Leerlingoverzicht - {selectedClassName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Ahmed Al-Rashid', 'Fatima Hassan', 'Omar Mansour'].map((studentName, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                              {studentName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-medium">{studentName}</h4>
                              <p className="text-sm text-muted-foreground">
                                Voortgang: Niveau 2 - Les 8/15
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">85% aanwezig</Badge>
                            <Button variant="outline" size="sm">Profiel</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Forumbeheer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium">Nieuwe vraag over uitspraak</h4>
                          <p className="text-sm text-muted-foreground">Ahmed - 2 uur geleden</p>
                        </div>
                        <Button variant="outline" size="sm">Beantwoorden</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {/* Video Modal */}
      <Dialog open={videoModal.open} onOpenChange={(open) => setVideoModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl w-full">
          <DialogTitle>{videoModal.title}</DialogTitle>
          <div className="aspect-video">
            {videoModal.url && (
              <div className="w-full h-full">
                <iframe
                  src={videoModal.url.includes('youtube.com') ? videoModal.url.replace('watch?v=', 'embed/') : videoModal.url}
                  className="w-full h-full rounded"
                  allowFullScreen
                  title={videoModal.title}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Modal */}
      <AttendanceModal
        open={attendanceModal.open}
        onOpenChange={(open) => setAttendanceModal(prev => ({ ...prev, open }))}
        classId={attendanceModal.classId}
        className={attendanceModal.className}
      />

      {/* Performance Modal */}
      <PerformanceModal
        open={performanceModal.open}
        onOpenChange={(open) => setPerformanceModal(prev => ({ ...prev, open }))}
        classId={performanceModal.classId}
        className={performanceModal.className}
      />
    </div>
  );
};

export default TeacherDashboard;
