import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useTranslation } from '@/contexts/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CheckCircle, ChevronRight, MessageSquare, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LevelQuestions } from '@/components/tasks/LevelQuestions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface UpcomingTask {
  id: string;
  title: string;
  type: string;
  niveau_id: string;
}

interface CompletedTask {
  id: string;
  vraag_id: string;
  score: number | null;
  completedDate: string;
  feedback: string | null;
  vraag_tekst?: string;
}

const Taken = () => {
  const { user, authReady, loading: authLoading } = useAuth();
  const { getTextAlign, getFlexDirection } = useRTLLayout();
  const { getNavigationAttributes } = useAccessibilityRTL();
  const { t } = useTranslation();
  
  const [selectedNiveauId, setSelectedNiveauId] = useState<string | null>(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');
  const [showFeedbackId, setShowFeedbackId] = useState<string | null>(null);

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['student-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return { upcoming: [], completed: [] };
      
      // Fetch student's answers with feedback
      const { data: answers } = await supabase
        .from('antwoorden')
        .select('vraag_id, is_correct, punten, created_at, feedback')
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
        .limit(50);
      
      const upcoming: UpcomingTask[] = (vragen || [])
        .filter(v => !completedIds.has(v.id))
        .map(v => ({ 
          id: v.id, 
          title: v.vraag_tekst, 
          type: v.vraag_type,
          niveau_id: v.niveau_id
        }));
      
      // Build completed tasks with feedback and question text
      const vraagMap = new Map((vragen || []).map(v => [v.id, v.vraag_tekst]));
      
      const completed: CompletedTask[] = (answers || []).map(a => ({
        id: a.vraag_id,
        vraag_id: a.vraag_id,
        score: a.punten,
        completedDate: new Date(a.created_at).toLocaleDateString('nl-NL'),
        feedback: a.feedback,
        vraag_tekst: vraagMap.get(a.vraag_id) || 'Vraag',
      }));
      
      return { upcoming, completed };
    },
    enabled: !!user?.id,
  });

  const handleStartTask = (task: UpcomingTask) => {
    setSelectedNiveauId(task.niveau_id);
    setSelectedTaskTitle(task.title);
  };

  const handleCloseQuestions = () => {
    setSelectedNiveauId(null);
    setSelectedTaskTitle('');
    refetch(); // Refresh data after closing
  };

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
          {/* Upcoming Tasks */}
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
                tasks?.upcoming?.map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex justify-between items-start ${getFlexDirection('row')}`}>
                      <div className="space-y-2 flex-1">
                        <h3 className={`font-medium ${getTextAlign()}`}>{task.title}</h3>
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full">{task.type}</span>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleStartTask(task)}
                        className="ml-4"
                      >
                        {t('tasks.start') || 'Starten'}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Completed Tasks with Feedback */}
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
                tasks?.completed?.map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <h3 className={`font-medium text-sm ${getTextAlign()}`}>
                        {task.vraag_tekst}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm text-muted-foreground`}>
                          Voltooid op: {task.completedDate}
                        </p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Score: {task.score ?? '-'}
                        </span>
                      </div>
                      
                      {/* Feedback section */}
                      {task.feedback && (
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            onClick={() => setShowFeedbackId(showFeedbackId === task.id ? null : task.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {showFeedbackId === task.id ? 'Feedback verbergen' : 'Bekijk feedback'}
                          </Button>
                          
                          {showFeedbackId === task.id && (
                            <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <p className="text-sm font-medium mb-1">Feedback van leerkracht:</p>
                              <p className="text-sm text-muted-foreground">{task.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
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

      {/* Questions Dialog */}
      <Dialog open={!!selectedNiveauId} onOpenChange={(open) => !open && handleCloseQuestions()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTaskTitle || 'Vraag beantwoorden'}</span>
            </DialogTitle>
            <DialogDescription>
              Beantwoord de vraag hieronder en klik op "Indienen" om je antwoord te versturen.
            </DialogDescription>
          </DialogHeader>
          
          {selectedNiveauId && (
            <LevelQuestions levelId={selectedNiveauId} />
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleCloseQuestions}>
              <X className="h-4 w-4 mr-2" />
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Taken;
