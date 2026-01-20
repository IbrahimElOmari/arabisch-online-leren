import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useTranslation } from '@/contexts/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, CheckCircle, ChevronRight, MessageSquare, X, FileText, HelpCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LevelQuestions } from '@/components/tasks/LevelQuestions';
import { TaskSubmissionDialog } from '@/components/tasks/TaskSubmissionDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface UpcomingTask {
  id: string;
  title: string;
  type: 'vraag' | 'task';
  subType?: string;
  niveau_id: string;
  description?: string;
  required_submission_type?: 'text' | 'file';
}

interface CompletedTask {
  id: string;
  type: 'vraag' | 'task';
  score: number | null;
  completedDate: string;
  feedback: string | null;
  title: string;
}

const Taken = () => {
  const { user, authReady, loading: authLoading } = useAuth();
  const { getTextAlign, getFlexDirection } = useRTLLayout();
  const { getNavigationAttributes } = useAccessibilityRTL();
  const { t } = useTranslation();
  
  // Dialog states
  const [selectedNiveauId, setSelectedNiveauId] = useState<string | null>(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<UpcomingTask | null>(null);
  const [showFeedbackId, setShowFeedbackId] = useState<string | null>(null);

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['student-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return { upcoming: [], completed: [] };
      
      // Fetch student's answers (for vragen)
      const { data: answers } = await supabase
        .from('antwoorden')
        .select('vraag_id, is_correct, punten, created_at, feedback')
        .eq('student_id', user.id);
      
      const completedVraagIds = new Set((answers || []).map(a => a.vraag_id));
      
      // Fetch task_submissions (for tasks)
      const { data: taskSubmissions } = await supabase
        .from('task_submissions')
        .select('task_id, grade, feedback, submitted_at')
        .eq('student_id', user.id);
      
      const completedTaskIds = new Set((taskSubmissions || []).map(s => s.task_id));
      
      // Fetch enrollments (without payment check - handled by RLS)
      const { data: enrollments } = await supabase
        .from('inschrijvingen')
        .select('class_id')
        .eq('student_id', user.id);
      
      const classIds = (enrollments || []).map(e => e.class_id);
      
      if (classIds.length === 0) return { upcoming: [], completed: [] };
      
      // Fetch levels for enrolled classes
      const { data: levels } = await supabase
        .from('niveaus')
        .select('id')
        .in('class_id', classIds);
      
      const levelIds = (levels || []).map(l => l.id);
      
      if (levelIds.length === 0) return { upcoming: [], completed: [] };
      
      // Fetch VRAGEN
      const { data: vragen } = await supabase
        .from('vragen')
        .select('id, vraag_tekst, vraag_type, niveau_id')
        .in('niveau_id', levelIds)
        .limit(50);
      
      // Fetch TASKS
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, description, level_id, required_submission_type')
        .in('level_id', levelIds)
        .limit(50);
      
      // Build upcoming list (both vragen and tasks)
      const upcoming: UpcomingTask[] = [
        ...(vragen || [])
          .filter(v => !completedVraagIds.has(v.id))
          .map(v => ({ 
            id: v.id, 
            title: v.vraag_tekst, 
            type: 'vraag' as const,
            subType: v.vraag_type,
            niveau_id: v.niveau_id
          })),
        ...(tasksData || [])
          .filter(t => !completedTaskIds.has(t.id))
          .map(t => ({
            id: t.id,
            title: t.title,
            type: 'task' as const,
            niveau_id: t.level_id,
            description: t.description || undefined,
            required_submission_type: t.required_submission_type as 'text' | 'file'
          }))
      ];
      
      // Build completed list
      const vraagMap = new Map((vragen || []).map(v => [v.id, v.vraag_tekst]));
      const taskMap = new Map((tasksData || []).map(t => [t.id, t.title]));
      
      const completed: CompletedTask[] = [
        ...(answers || []).map(a => ({
          id: a.vraag_id,
          type: 'vraag' as const,
          score: a.punten,
          completedDate: new Date(a.created_at).toLocaleDateString('nl-NL'),
          feedback: a.feedback,
          title: vraagMap.get(a.vraag_id) || t('tasks.question', 'Vraag'),
        })),
        ...(taskSubmissions || []).map(s => ({
          id: s.task_id,
          type: 'task' as const,
          score: s.grade,
          completedDate: new Date(s.submitted_at).toLocaleDateString('nl-NL'),
          feedback: s.feedback,
          title: taskMap.get(s.task_id) || t('tasks.assignment', 'Opdracht'),
        }))
      ];
      
      return { upcoming, completed };
    },
    enabled: !!user?.id,
  });

  const handleStartTask = (task: UpcomingTask) => {
    if (task.type === 'vraag') {
      setSelectedNiveauId(task.niveau_id);
      setSelectedTaskTitle(task.title);
    } else {
      setSelectedTask(task);
    }
  };

  const handleCloseQuestions = () => {
    setSelectedNiveauId(null);
    setSelectedTaskTitle('');
    refetch();
  };

  const handleCloseTaskDialog = () => {
    setSelectedTask(null);
    refetch();
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
          {t('tasks.title')}
        </h1>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${getTextAlign()}`}>
                <Clock className="h-5 w-5 text-primary" />
                {t('tasks.upcoming')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
              ) : tasks?.upcoming?.length === 0 ? (
                <p className="text-muted-foreground">{t('tasks.noTasks', 'Geen openstaande taken')}</p>
              ) : (
                tasks?.upcoming?.map((task) => (
                  <div key={`${task.type}-${task.id}`} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex justify-between items-start ${getFlexDirection('row')}`}>
                      <div className="space-y-2 flex-1">
                        <h3 className={`font-medium ${getTextAlign()}`}>{task.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={task.type === 'vraag' ? 'secondary' : 'default'}>
                            {task.type === 'vraag' ? (
                              <><HelpCircle className="h-3 w-3 me-1" />{t('tasks.question', 'Vraag')}</>
                            ) : (
                              <><FileText className="h-3 w-3 me-1" />{t('tasks.assignment', 'Opdracht')}</>
                            )}
                          </Badge>
                          {task.subType && (
                            <span className="text-xs text-muted-foreground">{task.subType}</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleStartTask(task)}
                        className="ms-4"
                      >
                        {t('tasks.start')}
                        <ChevronRight className="h-4 w-4 ms-1" />
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
                {t('tasks.completed')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
              ) : tasks?.completed?.length === 0 ? (
                <p className="text-muted-foreground">{t('tasks.noCompleted', 'Nog geen voltooide taken')}</p>
              ) : (
                tasks?.completed?.map((task) => (
                  <div key={`${task.type}-${task.id}`} className="p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={task.type === 'vraag' ? 'outline' : 'secondary'} className="text-xs">
                          {task.type === 'vraag' ? t('tasks.question', 'Vraag') : t('tasks.assignment', 'Opdracht')}
                        </Badge>
                        <h3 className={`font-medium text-sm flex-1 ${getTextAlign()}`}>
                          {task.title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm text-muted-foreground`}>
                          {t('tasks.completedOn', 'Voltooid op')}: {task.completedDate}
                        </p>
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full">
                          {t('tasks.score', 'Score')}: {task.score ?? '-'}
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
                            <MessageSquare className="h-4 w-4 me-2" />
                            {showFeedbackId === task.id 
                              ? t('tasks.hideFeedback', 'Feedback verbergen') 
                              : t('tasks.viewFeedback', 'Bekijk feedback')}
                          </Button>
                          
                          {showFeedbackId === task.id && (
                            <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <p className="text-sm font-medium mb-1">{t('tasks.teacherFeedback', 'Feedback van leerkracht')}:</p>
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
              {t('tasks.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid md:grid-cols-3 gap-4 ${getFlexDirection('row')}`}>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <span className="font-medium">{t('tasks.practiceWriting')}</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <span className="font-medium">{t('tasks.vocabularyReview')}</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <span className="font-medium">{t('tasks.listeningPractice')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions Dialog (for vragen) */}
      <Dialog open={!!selectedNiveauId} onOpenChange={(open) => !open && handleCloseQuestions()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTaskTitle || t('tasks.answerQuestion', 'Vraag beantwoorden')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('tasks.answerDescription', 'Beantwoord de vraag hieronder en klik op "Indienen" om je antwoord te versturen.')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNiveauId && (
            <LevelQuestions levelId={selectedNiveauId} />
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleCloseQuestions}>
              <X className="h-4 w-4 me-2" />
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Submission Dialog (for tasks) */}
      {selectedTask && (
        <TaskSubmissionDialog
          open={!!selectedTask}
          onClose={handleCloseTaskDialog}
          task={{
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description,
            required_submission_type: selectedTask.required_submission_type || 'text'
          }}
          onSuccess={refetch}
        />
      )}
    </div>
  );
};

export default Taken;
