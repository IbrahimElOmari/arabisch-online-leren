import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, GraduationCap, BookOpen, MessageSquare, Video } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { WelcomeWidget } from './WelcomeWidget';
import { LevelOverview, type LevelData } from './LevelOverview';
import { LevelDetail } from './LevelDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import PastLessonsManager from '@/components/lessons/PastLessonsManager';

interface EnrolledClass {
  id: string;
  class_id: string;
  payment_status: string;
  klassen: {
    id: string;
    name: string;
    description: string;
  };
}

type ViewState = 'classes' | 'levels' | 'detail';

const StudentDashboard = () => {
  const { signOut, profile } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('classes');
  const [selectedClass, setSelectedClass] = useState<EnrolledClass | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrolledClasses();
  }, []);

  const fetchEnrolledClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('inschrijvingen')
        .select(`
          id,
          class_id,
          payment_status,
          klassen:class_id (
            id,
            name,
            description
          )
        `)
        .eq('student_id', profile?.id)
        .eq('payment_status', 'paid');

      if (error) throw error;
      setEnrolledClasses(data || []);
    } catch (error) {
      console.error('Error fetching enrolled classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockLevels: LevelData[] = [
    {
      id: 'level-1',
      name: 'Niveau 1',
      isCompleted: true,
      isAccessible: true,
      currentLesson: 15,
      totalLessons: 15
    },
    {
      id: 'level-2',
      name: 'Niveau 2',
      isCompleted: false,
      isAccessible: true,
      currentLesson: 8,
      totalLessons: 15
    },
    {
      id: 'level-3',
      name: 'Niveau 3',
      isCompleted: false,
      isAccessible: false,
      currentLesson: 0,
      totalLessons: 15
    },
    {
      id: 'level-4',
      name: 'Niveau 4',
      isCompleted: false,
      isAccessible: false,
      currentLesson: 0,
      totalLessons: 15
    }
  ];

  const handleClassClick = (classData: EnrolledClass) => {
    setSelectedClass(classData);
    setViewState('levels');
  };

  const handleLevelClick = (levelId: string) => {
    setSelectedLevel(levelId);
    setViewState('detail');
  };

  const handleBackToClasses = () => {
    setViewState('classes');
    setSelectedClass(null);
    setSelectedLevel(null);
  };

  const handleBackToLevels = () => {
    setViewState('levels');
    setSelectedLevel(null);
  };

  const getRecentActivity = () => {
    return "Je hebt de voorbereiding voor 'Les 4 (Niveau 1)' voltooid.";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            {viewState !== 'classes' && (
              <Button variant="outline" onClick={handleBackToClasses}>
                ← Dashboard
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Leerling Dashboard</h1>
              <p className="text-muted-foreground">Welkom, {profile?.full_name}</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Uitloggen
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {viewState === 'classes' && (
          <>
            <WelcomeWidget recentActivity={getRecentActivity()} />
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Mijn Klassen
                </h2>
                
                {enrolledClasses.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Je bent nog niet ingeschreven voor een klas.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledClasses.map((enrollment) => (
                      <Card 
                        key={enrollment.id}
                        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                        onClick={() => handleClassClick(enrollment)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {enrollment.klassen.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm mb-4">
                            {enrollment.klassen.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">
                              ✓ Ingeschreven
                            </span>
                            <Button variant="outline" size="sm">
                              Open Klas →
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {enrolledClasses.length > 0 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Voorbije Lessen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PastLessonsManager 
                        classId={enrolledClasses[0]?.class_id}
                        niveauId={undefined}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Forum
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Discussieer met je klasgenoten en leerkrachten
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/forum'}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Ga naar Forum
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </>
        )}

        {viewState === 'levels' && selectedClass && (
          <LevelOverview
            classId={selectedClass.class_id}
            className={selectedClass.klassen.name}
            levels={mockLevels}
            onLevelClick={handleLevelClick}
          />
        )}

        {viewState === 'detail' && selectedClass && selectedLevel && (
          <LevelDetail
            levelId={selectedLevel}
            levelName={mockLevels.find(l => l.id === selectedLevel)?.name || ''}
            className={selectedClass.klassen.name}
            onBack={handleBackToLevels}
          />
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;