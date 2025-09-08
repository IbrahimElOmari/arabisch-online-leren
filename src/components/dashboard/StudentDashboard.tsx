import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MessageCircle, BarChart3, ChevronRight, Users, Target, Trophy, Clock, CheckCircle, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useTranslation } from '@/contexts/TranslationContext';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { TouchButton } from '@/components/touch/TouchOptimizedComponents';
import { DashboardSkeleton } from '@/components/ui/enhanced-loading-system';
import { EnhancedStudentTasksAndQuestions } from '@/components/student/EnhancedStudentTasksAndQuestions';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { LevelProgressCard } from '@/components/progress/LevelProgressCard';
import { ThemeAwareProgressCard } from '@/components/progress/ThemeAwareProgressCard';
import { ContinueLearningCard } from '@/components/progress/ContinueLearningCard';
import { RecentAchievements } from '@/components/progress/RecentAchievements';
import { useAgeTheme } from '@/contexts/AgeThemeContext';

type NiveauItem = {
  id: string;
  naam: string;
  beschrijving: string | null;
  niveau_nummer?: number;
};

interface EnrolledClass {
  id: string;
  class_id: string;
  payment_status: string;
  klassen: {
    id: string;
    name: string;
    description: string | null;
    niveaus: NiveauItem[];
  };
}

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const { getTextAlign } = useRTLLayout();
  const { themeAge } = useAgeTheme();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<EnrolledClass | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<NiveauItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch student progress data
  const { progress: progressData, isLoading: progressLoading } = useStudentProgress(user?.id);

  useEffect(() => {
    if (profile?.id) {
      fetchEnrolledClasses();
    }
  }, [profile?.id]);

  const fetchEnrolledClasses = async () => {
    try {
      setIsLoading(true);
      console.debug('🔎 Fetching enrolled classes for student:', profile?.id);

      const { data: enrollmentData, error: enrollmentError } = await supabase
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
        .eq('student_id', profile?.id as string)
        .eq('payment_status', 'paid');

      if (enrollmentError) throw enrollmentError;

      type RawEnrollment = {
        id: string;
        class_id: string;
        payment_status: string;
        klassen: {
          id: string;
          name: string;
          description: string | null;
        } | null;
      };

      const enrollments = (enrollmentData ?? []) as unknown as RawEnrollment[];
      console.debug('✅ Enrollments loaded:', enrollments);

      const classIds = enrollments.map((e) => e.class_id).filter(Boolean);
      if (classIds.length === 0) {
        setEnrolledClasses([]);
        setSelectedClass(null);
        setSelectedLevel(null);
        return;
      }

      const { data: niveausData, error: niveausError } = await supabase
        .from('niveaus')
        .select('id, naam, beschrijving, class_id, niveau_nummer')
        .in('class_id', classIds)
        .order('niveau_nummer', { ascending: true });

      if (niveausError) throw niveausError;

      type NiveauRow = {
        id: string;
        naam: string;
        beschrijving: string | null;
        class_id: string;
        niveau_nummer: number;
      };

      const niveausByClass = new Map<string, NiveauItem[]>();
      (niveausData as unknown as NiveauRow[] | null)?.forEach((n) => {
        const arr = niveausByClass.get(n.class_id) ?? [];
        arr.push({ 
          id: n.id, 
          naam: n.naam, 
          beschrijving: n.beschrijving,
          niveau_nummer: n.niveau_nummer 
        });
        niveausByClass.set(n.class_id, arr);
      });

      const merged: EnrolledClass[] = enrollments.map((e) => ({
        id: e.id,
        class_id: e.class_id,
        payment_status: e.payment_status,
        klassen: {
          id: e.klassen?.id ?? e.class_id,
          name: e.klassen?.name ?? 'Onbekende klas',
          description: e.klassen?.description ?? null,
          niveaus: niveausByClass.get(e.class_id) ?? [],
        },
      }));

      console.debug('📚 Merged enrolled classes with levels:', merged);
      setEnrolledClasses(merged);

      if (merged.length > 0) {
        setSelectedClass(merged[0]);
        const firstLevel = merged[0].klassen.niveaus[0] ?? null;
        setSelectedLevel(firstLevel);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching enrolled classes:', error);
      }
      setEnrolledClasses([]);
      setSelectedClass(null);
      setSelectedLevel(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Find current level progress (incomplete level with highest points)
  const getCurrentLevelProgress = () => {
    if (!progressData.length || !selectedClass) return null;
    
    const classLevels = selectedClass.klassen.niveaus;
    const incompleteLevels = progressData
      .filter(p => !p.is_completed && classLevels.some(n => n.id === p.niveau_id))
      .sort((a, b) => b.total_points - a.total_points);
      
    return incompleteLevels[0] || null;
  };

  const currentLevelProgress = getCurrentLevelProgress();

  const handleContinueLearning = (niveauId: string) => {
    const niveau = selectedClass?.klassen.niveaus.find(n => n.id === niveauId);
    if (niveau) {
      setSelectedLevel(niveau);
    }
  };

  if (isLoading || progressLoading) {
    return <DashboardSkeleton />;
  }

  if (!enrolledClasses.length) {
    return (
      <div className="p-6 text-center">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-4">Geen inschrijvingen gevonden</h2>
        <p className="text-muted-foreground">Je bent nog niet ingeschreven voor een klas.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6">
        {/* Header with Level Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  {currentLevelProgress ? (
                    <Target className="h-6 w-6 text-primary" />
                  ) : (
                    <Trophy className="h-6 w-6 text-success" />
                  )}
                  {t('dashboard.welcome')} {profile?.full_name || user?.email}! 👋
                </CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-muted-foreground">
                    Welkom terug bij je Arabisch leertraject
                  </p>
                  {currentLevelProgress && (
                    <Badge variant="outline" className="text-sm">
                      Huidig Level: {currentLevelProgress.niveau?.naam}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                Leerling
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Continue Learning Section */}
        {selectedClass && (
          <ContinueLearningCard 
            currentProgress={currentLevelProgress}
            onContinue={handleContinueLearning}
          />
        )}

        {/* Class and Level Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Klas & Level Selectie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Selecteer een klas:</h4>
                <div className="flex flex-wrap gap-2">
                  {enrolledClasses.map((enrollment) => (
                    <TouchButton
                      key={enrollment.id}
                      variant={selectedClass?.class_id === enrollment.class_id ? "default" : "outline"}
                      size="touch"
                      onClick={() => {
                        setSelectedClass(enrollment);
                        if (enrollment.klassen.niveaus.length > 0) {
                          setSelectedLevel(enrollment.klassen.niveaus[0]);
                        } else {
                          setSelectedLevel(null);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      {enrollment.klassen.name}
                    </TouchButton>
                  ))}
                </div>
              </div>
              
              {selectedClass && selectedClass.klassen.niveaus.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">
                    Niveaus in {selectedClass.klassen.name}:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClass.klassen.niveaus.map((niveau) => (
                      <TouchButton
                        key={niveau.id}
                        variant={selectedLevel?.id === niveau.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedLevel(niveau)}
                      >
                        {niveau.naam}
                      </TouchButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        {selectedClass && selectedLevel && (
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Taken & Vragen
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Level Voortgang
              </TabsTrigger>
              <TabsTrigger value="forum" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Forum
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-6">
              <Suspense fallback={<DashboardSkeleton />}>
                <EnhancedStudentTasksAndQuestions 
                  levelId={selectedLevel.id} 
                  levelName={selectedLevel.naam}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Level Progress Cards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Je Level Voortgang</h3>
                  {selectedClass?.klassen.niveaus.map((niveau) => {
                    const levelProgress = progressData.find(p => p.niveau_id === niveau.id);
                    const isCurrentLevel = currentLevelProgress?.niveau_id === niveau.id;
                    
                    return (
                      <ThemeAwareProgressCard
                        key={niveau.id}
                        progress={levelProgress || {
                          id: '',
                          student_id: user?.id || '',
                          niveau_id: niveau.id,
                          total_points: 0,
                          completed_tasks: 0,
                          completed_questions: 0,
                          is_completed: false,
                          created_at: '',
                          updated_at: '',
                          niveau: niveau
                        }}
                        isCurrentLevel={isCurrentLevel}
                      />
                    );
                  })}
                </div>
                
                {/* Recent Achievements */}
                <div>
                  <RecentAchievements progressData={progressData} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="forum" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Forum</h3>
                      <p className="text-muted-foreground mb-4">
                        Discussieer met medestudenten en stel vragen aan je docent
                      </p>
                      <Link to="/forum">
                        <TouchButton variant="outline" className="inline-flex items-center gap-2">
                          Ga naar Forum
                          <ChevronRight className="h-4 w-4" />
                        </TouchButton>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;