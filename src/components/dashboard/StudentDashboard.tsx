import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MessageCircle, BarChart3, Users, Target, Trophy, GraduationCap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useTranslation } from '@/contexts/TranslationContext';
import { TouchButton } from '@/components/touch/TouchOptimizedComponents';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/ui/enhanced-loading-system';
import { EnhancedStudentTasksAndQuestions } from '@/components/student/EnhancedStudentTasksAndQuestions';
import { useEnhancedProgress } from '@/hooks/useEnhancedProgress';
import { ThemeAwareProgressCard } from '@/components/progress/ThemeAwareProgressCard';
import { ContinueLearningCard } from '@/components/progress/ContinueLearningCard';
import { RecentAchievements } from '@/components/progress/RecentAchievements';
import { EnhancedBadgeSystem } from '@/components/gamification/EnhancedBadgeSystem';
import { LeaderboardSystem } from '@/components/gamification/LeaderboardSystem';
import { RealtimeChat } from '@/components/communication/RealtimeChat';
import { EnhancedPointsDisplay } from '@/components/progress/EnhancedPointsDisplay';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

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
  const { isRTL } = useRTLLayout();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<EnrolledClass | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<NiveauItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch enhanced student progress data
  const { progress: progressData, isLoading: progressLoading } = useEnhancedProgress(user?.id);
  
  // Get notifications
  const { notifications, unreadCount } = useNotifications();

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
      if (import.meta.env.DEV) {
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
      .sort((a, b) => (b.total_points_with_bonus || 0) - (a.total_points_with_bonus || 0));
      
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
      <div className={cn("p-6 text-center", isRTL && "arabic-text")}>
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className={cn("text-2xl font-bold mb-4", isRTL && "arabic-text")}>
          {t('dashboard.no_enrollments')}
        </h2>
        <p className={cn("text-muted-foreground", isRTL && "arabic-text")}>
          {t('dashboard.not_enrolled')}
        </p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background p-4 sm:p-6 w-full"
      style={{ 
        minWidth: 0, 
        maxWidth: '100%'
      }}
    >
      {/* FIX: Removed @container class - not supported on all mobile browsers */}
      <div 
        className="w-full space-y-4 md:space-y-6"
        style={{ 
          width: '100%',
          minWidth: 0
        }}
      >
        {/* Header with Level Display */}
        <Card className="w-full">
          <CardHeader className="p-4 md:p-6">
            <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4", isRTL && "md:flex-row-reverse")}>
              <div className="flex-1 min-w-0">
                <CardTitle className={cn("text-xl md:text-2xl font-bold flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
                  {currentLevelProgress ? (
                    <Target className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                  ) : (
                    <Trophy className="h-5 w-5 md:h-6 md:w-6 text-success flex-shrink-0" />
                  )}
                  <span className={cn("truncate", isRTL && "arabic-text")}>
                    {t('welcome.greeting')}, {profile?.full_name || user?.email}! 👋
                  </span>
                </CardTitle>
                <div className={cn("flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4", isRTL && "sm:flex-row-reverse")}>
                  <p className={cn("text-sm md:text-base text-muted-foreground", isRTL && "arabic-text")}>
                    {t('dashboard.welcome_back')}
                  </p>
                  {currentLevelProgress && (
                    <Badge variant="outline" className={cn("text-xs md:text-sm w-fit", isRTL && "arabic-text")}>
                      {t('dashboard.current_level')}: {currentLevelProgress.niveau?.naam}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className={cn("text-xs md:text-sm w-fit", isRTL && "arabic-text")}>
                {t('dashboard.student_role')}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Enhanced Points Display */}
        <EnhancedPointsDisplay 
          progress={progressData}
          currentNiveauId={selectedLevel?.id}
          compact={false}
        />

        {/* Continue Learning Section */}
        {selectedClass && currentLevelProgress && (
          <ContinueLearningCard 
            currentProgress={currentLevelProgress}
            onContinue={handleContinueLearning}
          />
        )}

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className={isRTL ? 'arabic-text' : ''}>{t('dashboard.recent_notifications')}</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className={isRTL ? "me-2" : "ms-2"}>
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notifications.slice(0, 3).map((notification) => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border text-sm",
                      notification.is_read ? "bg-muted/50" : "bg-primary/10 border-primary/20",
                      isRTL && "arabic-text text-right"
                    )}
                  >
                    {notification.message}
                  </div>
                ))}
              </div>
              {notifications.length > 3 && (
                <div className="text-center mt-3">
                  <Button variant="outline" size="sm" className={isRTL ? 'arabic-text' : ''}>
                    {t('dashboard.view_all_notifications')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Class and Level Selection */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Users className="h-5 w-5" />
              <span className={isRTL ? 'arabic-text' : ''}>{t('dashboard.class_level_selection')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className={cn("font-medium mb-2", isRTL && "arabic-text text-right")}>
                  {t('dashboard.select_class')}:
                </h4>
                <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse")}>
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
                      className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className={isRTL ? 'arabic-text' : ''}>{enrollment.klassen.name}</span>
                    </TouchButton>
                  ))}
                </div>
              </div>
              
              {selectedClass && selectedClass.klassen.niveaus.length > 0 && (
                <div>
                  <h4 className={cn("font-medium mb-2", isRTL && "arabic-text text-right")}>
                    {t('dashboard.select_level')} {selectedClass.klassen.name}:
                  </h4>
                  <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse")}>
                    {selectedClass.klassen.niveaus.map((niveau) => (
                      <TouchButton
                        key={niveau.id}
                        variant={selectedLevel?.id === niveau.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedLevel(niveau)}
                        className={isRTL ? 'arabic-text' : ''}
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
            <div className="overflow-x-auto">
              <TabsList className={cn("grid w-full grid-cols-3 md:grid-cols-5 min-w-max", isRTL && "flex-row-reverse")}>
                <TabsTrigger value="tasks" className={cn("flex items-center gap-1 md:gap-2 text-xs md:text-sm", isRTL && "flex-row-reverse")}>
                  <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                  <span className={cn("hidden sm:inline", isRTL && "arabic-text")}>
                    {t('dashboard.tasks_questions')}
                  </span>
                  <span className={cn("sm:hidden", isRTL && "arabic-text")}>
                    {t('tasks.title')}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="progress" className={cn("flex items-center gap-1 md:gap-2 text-xs md:text-sm", isRTL && "flex-row-reverse")}>
                  <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                  <span className={cn("hidden sm:inline", isRTL && "arabic-text")}>
                    {t('dashboard.level_progress')}
                  </span>
                  <span className={cn("sm:hidden", isRTL && "arabic-text")}>
                    {t('common.progress')}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="badges" className={cn("flex items-center gap-1 md:gap-2 text-xs md:text-sm", isRTL && "flex-row-reverse")}>
                  <Trophy className="h-3 w-3 md:h-4 md:w-4" />
                  <span className={cn("hidden sm:inline", isRTL && "arabic-text")}>
                    {t('dashboard.badges_rankings')}
                  </span>
                  <span className={cn("sm:hidden", isRTL && "arabic-text")}>
                    {t('badges.earned')}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="chat" className={cn("hidden md:flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                  <MessageCircle className="h-4 w-4" />
                  <span className={isRTL ? 'arabic-text' : ''}>{t('teacher.chat')}</span>
                </TabsTrigger>
                <TabsTrigger value="forum" className={cn("hidden md:flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                  <MessageCircle className="h-4 w-4" />
                  <span className={isRTL ? 'arabic-text' : ''}>{t('nav.forum')}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tasks" className="mt-6">
              <Suspense fallback={<DashboardSkeleton />}>
                <EnhancedStudentTasksAndQuestions 
                  levelId={selectedLevel.id} 
                  levelName={selectedLevel.naam}
                />
              </Suspense>
            </TabsContent>

              <TabsContent value="progress" className="mt-4 md:mt-6">
              <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
                {/* Level Progress Cards */}
                <div className="space-y-3 md:space-y-4">
                  <h3 className={cn("text-lg md:text-xl font-semibold", isRTL && "arabic-text text-right")}>
                    {t('dashboard.your_level_progress')}
                  </h3>
                  {selectedClass?.klassen.niveaus.map((niveau) => {
                     const levelProgress = progressData.find(p => p.niveau_id === niveau.id);
                    const isCurrentLevel = currentLevelProgress?.niveau_id === niveau.id;
                    
                    const fallbackProgress = {
                      id: '',
                      student_id: user?.id || '',
                      niveau_id: niveau.id,
                      total_points: 0,
                      completed_tasks: 0,
                      completed_questions: 0,
                      is_completed: false as const,
                      completed_at: null,
                      created_at: '',
                      updated_at: '',
                      niveau: {
                        ...niveau,
                        beschrijving: niveau.beschrijving ?? null
                      }
                    };
                    
                    return (
                      <ThemeAwareProgressCard
                        key={niveau.id}
                        progress={levelProgress || fallbackProgress}
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

            <TabsContent value="badges" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <EnhancedBadgeSystem 
                    userId={user?.id || ''} 
                    niveauId={selectedLevel?.id}
                    showOnlyCurrentLevel={false}
                  />
                </div>
                <div>
                  <LeaderboardSystem 
                    classId={selectedClass?.class_id}
                    currentUserId={user?.id || ''}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <RealtimeChat 
                roomId={`class-${selectedClass?.class_id}`}
                roomType="class"
              />
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