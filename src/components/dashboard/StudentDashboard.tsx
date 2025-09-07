import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedStudentTasksAndQuestions } from '@/components/student/EnhancedStudentTasksAndQuestions';
import { LevelQuestions } from '@/components/tasks/LevelQuestions';
import { DashboardSkeleton } from '@/components/ui/enhanced-loading-system';
import { TouchButton } from '@/components/touch/TouchOptimizedComponents';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  GraduationCap
} from 'lucide-react';

type NiveauItem = {
  id: string;
  naam: string;
  beschrijving: string | null;
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
  const { profile } = useAuth();
  const { 
    isRTL, 
    getFlexDirection, 
    getTextAlign, 
    getMarginStart, 
    getMarginEnd 
  } = useRTLLayout();
  
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchEnrolledClasses();
    }
  }, [profile?.id]);

  const fetchEnrolledClasses = async () => {
    try {
      setLoading(true);
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
        setSelectedClass('');
        setSelectedLevel('');
        return;
      }

      const { data: niveausData, error: niveausError } = await supabase
        .from('niveaus')
        .select('id, naam, beschrijving, class_id')
        .in('class_id', classIds);

      if (niveausError) throw niveausError;

      type NiveauRow = {
        id: string;
        naam: string;
        beschrijving: string | null;
        class_id: string;
      };

      const niveausByClass = new Map<string, NiveauItem[]>();
      (niveausData as unknown as NiveauRow[] | null)?.forEach((n) => {
        const arr = niveausByClass.get(n.class_id) ?? [];
        arr.push({ id: n.id, naam: n.naam, beschrijving: n.beschrijving });
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
        setSelectedClass(merged[0].class_id);
        const firstLevelId = merged[0].klassen.niveaus[0]?.id ?? '';
        setSelectedLevel(firstLevelId);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching enrolled classes:', error);
      }
      setEnrolledClasses([]);
      setSelectedClass('');
      setSelectedLevel('');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentClass = () => {
    return enrolledClasses.find(enrollment => enrollment.class_id === selectedClass);
  };

  const getCurrentLevel = () => {
    const currentClass = getCurrentClass();
    return currentClass?.klassen.niveaus.find(niveau => niveau.id === selectedLevel);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (enrolledClasses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-4">Geen ingeschreven klassen</h2>
              <p className="text-muted-foreground mb-4">
                Je bent nog niet ingeschreven voor een klas. Neem contact op met je leerkracht of admin.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentClass = getCurrentClass();
  const currentLevel = getCurrentLevel();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? `أهلاً وسهلاً، ${profile?.full_name}!` : `Welkom, ${profile?.full_name}!`}
          </h1>
          <p className={`text-muted-foreground ${getTextAlign()}`}>
            {isRTL ? 'هنا تجد دروسك ومهامك وتقدمك.' : 'Hier vind je je lessen, taken en voortgang.'}
          </p>
        </div>

        <div className="grid gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <Users className="h-5 w-5" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'صفوفي' : 'Mijn Klassen'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex flex-wrap gap-2 mb-4 ${getFlexDirection()}`}>
                {enrolledClasses.map((enrollment) => (
                  <TouchButton
                    key={enrollment.id}
                    variant={selectedClass === enrollment.class_id ? "default" : "outline"}
                    size="touch"
                    onClick={() => {
                      setSelectedClass(enrollment.class_id);
                      if (enrollment.klassen.niveaus.length > 0) {
                        setSelectedLevel(enrollment.klassen.niveaus[0].id);
                      } else {
                        setSelectedLevel('');
                      }
                    }}
                    className={`flex items-center gap-2 ${getFlexDirection()}`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className={isRTL ? 'arabic-text' : ''}>{enrollment.klassen.name}</span>
                  </TouchButton>
                ))}
              </div>
              
              {currentClass && currentClass.klassen.niveaus.length > 0 && (
                <div>
                  <h4 className={`font-medium mb-2 ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
                    {isRTL ? `المستويات في ${currentClass.klassen.name}:` : `Niveaus in ${currentClass.klassen.name}:`}
                  </h4>
                   <div className={`flex flex-wrap gap-2 ${getFlexDirection()}`}>
                    {currentClass.klassen.niveaus.map((niveau) => (
                      <TouchButton
                        key={niveau.id}
                        variant={selectedLevel === niveau.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedLevel(niveau.id)}
                        className={isRTL ? 'arabic-text' : ''}
                      >
                        {niveau.naam}
                      </TouchButton>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {currentClass && currentLevel && (
          <Tabs defaultValue="content" className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <CheckCircle className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'المهام والأسئلة' : 'Taken & Vragen'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="forum" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <MessageSquare className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'المنتدى' : 'Forum'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="progress" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <Trophy className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'التقدم' : 'Voortgang'}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-6">
              <EnhancedStudentTasksAndQuestions 
                levelId={selectedLevel} 
                levelName={currentLevel.naam}
              />
            </TabsContent>

            <TabsContent value="forum" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'منتدى الصف' : 'Klasforum'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-muted-foreground mb-4 ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
                    {isRTL ? 'اذهب إلى المنتدى للمناقشة مع زملائك في الصف.' : 'Ga naar het forum om te discussiëren met je klasgenoten.'}
                  </p>
                  <Link to="/forum" className={`flex items-center gap-2 ${getFlexDirection()}`}>
                    <TouchButton size="touch">
                      <MessageSquare className="h-4 w-4" />
                      <span className={isRTL ? 'arabic-text' : ''}>
                        {isRTL ? 'إلى المنتدى' : 'Naar Forum'}
                      </span>
                    </TouchButton>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${getFlexDirection()}`}>
                      <Trophy className="h-5 w-5" />
                      <span className={isRTL ? 'arabic-text' : ''}>
                        {isRTL ? 'النتائج المحققة' : 'Behaalde Resultaten'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-muted-foreground ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
                      {isRTL ? 'هنا ستشاهد قريباً النقاط والشارات التي حصلت عليها.' : 'Hier zie je binnenkort je behaalde punten en badges.'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${getFlexDirection()}`}>
                      <Clock className="h-5 w-5" />
                      <span className={isRTL ? 'arabic-text' : ''}>
                        {isRTL ? 'النشاط الأخير' : 'Recente Activiteit'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-muted-foreground ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
                      {isRTL ? 'هنا تشاهد تقديماتك الأخيرة والتقييمات.' : 'Hier zie je je recente inzendingen en beoordelingen.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
