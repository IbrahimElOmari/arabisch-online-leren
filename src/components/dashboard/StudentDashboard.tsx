import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, GraduationCap, BookOpen, MessageSquare, Video } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { WelcomeWidget } from './WelcomeWidget';
import { LevelOverview, type LevelData } from './LevelOverview';
import { LevelDetail } from './LevelDetail';
import { StudentStats } from './StudentStats';
import { ActivityFeed } from './ActivityFeed';
import { QuickActions } from './QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import PastLessonsManager from '@/components/lessons/PastLessonsManager';
import { StudentTaskNotifications } from '@/components/tasks/StudentTaskNotifications';
import { BadgeSystem, type UserBadge, type UserLevel } from '@/components/gamification/BadgeSystem';
import { StreakCounter } from '@/components/gamification/StreakCounter';

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
  const navigate = useNavigate();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('classes');
  const [selectedClass, setSelectedClass] = useState<EnrolledClass | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Mock gamification data
  const mockBadges: UserBadge[] = [
    {
      id: '1',
      name: 'Eerste Les',
      description: 'Voltooi je eerste les',
      icon: 'star',
      earned: true,
      earnedAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Week Warrior',
      description: 'Leer 7 dagen op rij',
      icon: 'trophy',
      earned: true,
      earnedAt: '2024-01-20'
    },
    {
      id: '3',
      name: 'Alfabet Master',
      description: 'Beheers het Arabische alfabet',
      icon: 'crown',
      earned: false,
      progress: 18,
      maxProgress: 28
    },
    {
      id: '4',
      name: 'Quiz Champion',
      description: 'Haal 90%+ op 5 quizzes',
      icon: 'target',
      earned: false,
      progress: 2,
      maxProgress: 5
    }
  ];

  const mockUserLevel: UserLevel = {
    currentLevel: 3,
    currentXP: 850,
    nextLevelXP: 1000,
    totalXP: 2850
  };

  const mockStreakData = {
    currentStreak: 7,
    longestStreak: 12,
    lastActivity: '2024-01-21T10:30:00Z',
    todayCompleted: true,
    weeklyGoal: 5,
    weeklyProgress: 4
  };

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

  const mockActivities = [
    {
      id: '1',
      type: 'lesson_completed' as const,
      title: 'Les 4 voltooid',
      description: 'Arabische Grammatica - Niveau 1',
      timestamp: '2 uur geleden',
      points: 50
    },
    {
      id: '2',
      type: 'achievement' as const,
      title: 'Eerste week voltooid!',
      description: 'Je hebt je eerste week van leren afgerond',
      timestamp: '1 dag geleden',
      points: 100
    },
    {
      id: '3',
      type: 'forum_post' as const,
      title: 'Vraag gesteld in forum',
      description: 'Over uitspraak van de letter ض',
      timestamp: '2 dagen geleden'
    }
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'continue-learning':
        if (enrolledClasses.length > 0) {
          handleClassClick(enrolledClasses[0]);
        }
        break;
      case 'forum':
        navigate('/forum');
        break;
      case 'schedule':
        navigate('/calendar');
        break;
      default:
        console.log('Action:', action);
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
            <div className="space-y-8">
              {/* Gamification Section */}
              <div className="space-y-6">
                <StreakCounter streakData={mockStreakData} />
                <BadgeSystem 
                  badges={mockBadges} 
                  userLevel={mockUserLevel}
                  showProgress={true}
                />
              </div>

              {/* Stats Overview */}
              <StudentStats
                completedLessons={12}
                totalLessons={15}
                averageScore={85}
                studyTime={24}
                currentStreak={mockStreakData.currentStreak}
              />

              {/* Quick Actions */}
              <QuickActions onAction={(action) => {
                switch (action) {
                  case 'continue-learning':
                    if (enrolledClasses.length > 0) {
                      setSelectedClass(enrolledClasses[0]);
                      setViewState('levels');
                    }
                    break;
                  case 'forum':
                    navigate('/forum');
                    break;
                  case 'schedule':
                    navigate('/calendar');
                    break;
                  default:
                    console.log('Action:', action);
                }
              }} />

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Classes */}
                <div className="lg:col-span-2 space-y-6">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {enrolledClasses.map((enrollment) => (
                          <Card 
                            key={enrollment.id}
                            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20"
                            onClick={() => {
                              setSelectedClass(enrollment);
                              setViewState('levels');
                            }}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <BookOpen className="h-5 w-5 text-primary" />
                                {enrollment.klassen.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-muted-foreground text-sm mb-4">
                                {enrollment.klassen.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                                  ✓ Ingeschreven
                                </span>
                                <Button variant="outline" size="sm" className="text-xs">
                                  Open Klas →
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Additional sections for enrolled students */}
                  {enrolledClasses.length > 0 && (
                    <>
                      <StudentTaskNotifications />
                      
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
                    </>
                  )}
                </div>

                {/* Right Column - Activity Feed */}
                <div className="space-y-6">
                  <ActivityFeed activities={[
                    {
                      id: '1',
                      type: 'lesson_completed' as const,
                      title: 'Les 4 voltooid',
                      description: 'Arabische Grammatica - Niveau 1',
                      timestamp: '2 uur geleden',
                      points: 50
                    },
                    {
                      id: '2',
                      type: 'achievement' as const,
                      title: 'Eerste week voltooid!',
                      description: 'Je hebt je eerste week van leren afgerond',
                      timestamp: '1 dag geleden',
                      points: 100
                    },
                    {
                      id: '3',
                      type: 'forum_post' as const,
                      title: 'Vraag gesteld in forum',
                      description: 'Over uitspraak van de letter ض',
                      timestamp: '2 dagen geleden'
                    }
                  ]} />
                  
                  {enrolledClasses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Community
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4 text-sm">
                          Discussieer met je klasgenoten en leerkrachten
                        </p>
                        <Button 
                          onClick={() => navigate('/forum')}
                          className="w-full flex items-center gap-2"
                          variant="outline"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Ga naar Forum
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Level Overview */}
        {viewState === 'levels' && selectedClass && (
          <LevelOverview
            classId={selectedClass.class_id}
            className={selectedClass.klassen.name}
            levels={[
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
            ]}
            onLevelClick={(levelId) => {
              setSelectedLevel(levelId);
              setViewState('detail');
            }}
          />
        )}

        {/* Level Detail */}
        {viewState === 'detail' && selectedClass && selectedLevel && (
          <LevelDetail
            levelId={selectedLevel}
            levelName={['Niveau 1', 'Niveau 2', 'Niveau 3', 'Niveau 4'].find((_, i) => `level-${i+1}` === selectedLevel) || ''}
            className={selectedClass.klassen.name}
            onBack={handleBackToLevels}
          />
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
