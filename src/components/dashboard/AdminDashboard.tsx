import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Users, 
  BookOpen, 
  Settings, 
  CreditCard,
  BarChart3,
  Plus,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Video,
  FileQuestion,
  Calendar,
  Upload,
  CheckSquare,
  ClipboardList,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { WelcomeWidget } from './WelcomeWidget';
import { supabase } from '@/integrations/supabase/client';
import AdminSeeder from '@/components/admin/AdminSeeder';
import ForumModerationQueue from '@/components/forum/ForumModerationQueue';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AnnouncementSystem from '@/components/communication/AnnouncementSystem';
import { TeachingModal } from '@/components/teaching/TeachingModal';
import { AdminModal } from '@/components/admin/AdminModals';
import ClassOverviewModal from '@/components/admin/ClassOverviewModal';
import { ClassOptionsDropdown } from '@/components/admin/ClassOptionsDropdown';
import UserActivationPanel from '@/components/admin/UserActivationPanel';
import PastLessonsManager from '@/components/lessons/PastLessonsManager';
import { GradingInterface } from '@/components/teacher/GradingInterface';
import { TaskQuestionManagementNew } from '@/components/management/TaskQuestionManagementNew';

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

const AdminDashboard = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
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
    return "'Leerkracht Fatima' is toegewezen aan 'Klas voor Beginners'.";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  };

  const selectedClassName = klassen.find(c => c.id === selectedClass)?.name || '';
  const selectedLevelName = levels.find(l => l.id === selectedLevel)?.name || '';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
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

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin Beheer
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Gebruikersbeheer
            </TabsTrigger>
            <TabsTrigger value="teaching" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Leerkracht Functionaliteiten
            </TabsTrigger>
            <TabsTrigger value="grading" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Beoordelen
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Overzicht
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Beveiliging
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Betalingen
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Prestatiemonitor
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Communicatie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Admin Beheertools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AdminModal
                      type="create_class"
                      trigger={
                        <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                          <Plus className="h-6 w-6" />
                          <span className="text-sm">Nieuwe Klas Maken</span>
                        </Button>
                      }
                    />

                    <AdminModal
                      type="assign_teacher"
                      trigger={
                        <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                          <UserPlus className="h-6 w-6" />
                          <span className="text-sm">Leerkracht Toewijzen</span>
                        </Button>
                      }
                    />

                    <AdminModal
                      type="manage_users"
                      trigger={
                        <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                          <Users className="h-6 w-6" />
                          <span className="text-sm">Gebruikers & Toewijzingen</span>
                        </Button>
                      }
                    />

                    <Button 
                      variant="outline"
                      onClick={() => navigate('/forum-moderation')}
                      className="h-20 flex flex-col items-center gap-2"
                    >
                      <MessageSquare className="h-6 w-6" />
                      <span className="text-sm">Forum Moderatie</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <AdminSeeder />
            </div>

            <ForumModerationQueue />

            <Card>
              <CardHeader>
                <CardTitle>Klassen Overzicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {klassen.map((klas) => (
                    <div key={klas.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{klas.name}</h4>
                          <p className="text-sm text-muted-foreground">{klas.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={klas.teacher_id ? "default" : "secondary"}>
                          {klas.teacher_id ? "Toegewezen" : "Geen leerkracht"}
                        </Badge>
                        <ClassOptionsDropdown 
                          classId={klas.id} 
                          className={klas.name} 
                          onRefresh={fetchKlassen}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gebruikers & Toewijzingen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserActivationPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grading" className="space-y-6">
              <GradingInterface />
            </TabsContent>

            <TabsContent value="management" className="space-y-6">
              <TaskQuestionManagementNew />
            </TabsContent>

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

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Betalingen en Inschrijvingen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Ahmed Al-Rashid', class: 'Arabisch Avontuur (Onder 16)', level: 'Niveau 2', status: 'Betaald', date: '15-03-2024' },
                    { name: 'Fatima Hassan', class: 'Arabisch voor Beginners (16+)', level: 'Niveau 1', status: 'Betaald', date: '14-03-2024' },
                    { name: 'Omar Mansour', class: 'Arabisch Avontuur (Onder 16)', level: 'Niveau 3', status: 'Uitstaand', date: '13-03-2024' }
                  ].map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                          {payment.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium">{payment.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {payment.class} - {payment.level}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={payment.status === 'Betaald' ? 'default' : 'destructive'}>
                          {payment.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{payment.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => window.location.href = '/security'}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <ShieldCheck className="h-6 w-6" />
                    <span className="text-sm">Security Dashboard</span>
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/security'}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-sm">Content Moderatie</span>
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/security'}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">GDPR Compliance</span>
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/security'}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Audit Logs</span>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <AnnouncementSystem />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;