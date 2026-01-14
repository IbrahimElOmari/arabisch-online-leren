import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useTranslation } from '@/contexts/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Taken = () => {
  const { user, authReady, loading: authLoading } = useAuth();
  const { getTextAlign, getFlexDirection } = useRTLLayout();
  const { getNavigationAttributes } = useAccessibilityRTL();
  const { t } = useTranslation();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['student-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return { upcoming: [], completed: [] };
      
      // Fetch student's answers to determine completed tasks
      const { data: answers } = await supabase
        .from('antwoorden')
        .select('vraag_id, is_correct, punten, created_at')
        .eq('student_id', user.id);
      
      const completedIds = new Set((answers || []).map(a => a.vraag_id));
      
      // Fetch questions/tasks from enrolled levels
      const { data: enrollments } = await supabase
        .from('inschrijvingen')
        .select('class_id')
        .eq('student_id', user.id);
      
      const classIds = (enrollments || []).map(e => e.class_id);
      
      if (classIds.length === 0) return { upcoming: [], completed: [] };
      
      const { data: levels } = await supabase
        .from('niveaus')
        .select('id')
        .in('class_id', classIds);
      
      const levelIds = (levels || []).map(l => l.id);
      
      if (levelIds.length === 0) return { upcoming: [], completed: [] };
      
      const { data: vragen } = await supabase
        .from('vragen')
        .select('id, vraag_tekst, vraag_type, niveau_id')
        .in('niveau_id', levelIds)
        .limit(20);
      
      const upcoming = (vragen || [])
        .filter(v => !completedIds.has(v.id))
        .map(v => ({ id: v.id, title: v.vraag_tekst, type: v.vraag_type }));
      
      const completed = (answers || []).map(a => ({
        id: a.vraag_id,
        score: a.punten || 0,
        completedDate: new Date(a.created_at).toLocaleDateString('nl-NL')
      }));
      
      return { upcoming, completed };
    },
    enabled: !!user?.id,
  });

  if (authLoading && !authReady) {
    return <FullPageLoader text="Laden..." />;
  }

  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background" {...getNavigationAttributes()}>
      <div className="container mx-auto p-6">
        <h1 className={`text-3xl font-bold mb-8 ${getTextAlign()}`}>
          {t('tasks.title') || 'Taken & Opdrachten'}
        </h1>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${getTextAlign()}`}>
                <Clock className="h-5 w-5 text-primary" />
                {t('tasks.upcoming') || 'Aankomende Taken'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">Laden...</p>
              ) : tasks?.upcoming?.length === 0 ? (
                <p className="text-muted-foreground">Geen openstaande taken</p>
              ) : (
                tasks?.upcoming?.map((task: any) => (
                  <div key={task.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex justify-between items-start ${getFlexDirection('row')}`}>
                      <div className="space-y-2">
                        <h3 className={`font-medium ${getTextAlign()}`}>{task.title}</h3>
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full">{task.type}</span>
                      </div>
                      <Button variant="outline" size="sm">{t('tasks.start') || 'Starten'}</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${getTextAlign()}`}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                {t('tasks.completed') || 'Afgeronde Taken'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">Laden...</p>
              ) : tasks?.completed?.length === 0 ? (
                <p className="text-muted-foreground">Nog geen voltooide taken</p>
              ) : (
                tasks?.completed?.map((task: any) => (
                  <div key={task.id} className="p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <p className={`text-sm text-muted-foreground ${getTextAlign()}`}>
                        Voltooid op: {task.completedDate}
                      </p>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Score: {task.score}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${getTextAlign()}`}>
              <BookOpen className="h-5 w-5 text-primary" />
              {t('tasks.quickActions') || 'Snelle Acties'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid md:grid-cols-3 gap-4 ${getFlexDirection('row')}`}>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <span className="font-medium">{t('tasks.practiceWriting') || 'Schrijf Oefening'}</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <span className="font-medium">{t('tasks.vocabularyReview') || 'Woordenschat Herhaling'}</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <span className="font-medium">{t('tasks.listeningPractice') || 'Luister Oefening'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Taken;
