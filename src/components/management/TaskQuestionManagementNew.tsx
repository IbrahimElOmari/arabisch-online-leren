import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Question {
  id: string;
  niveau_id: string;
  vraag: string;
  audio_url?: string | null;
  correct_antwoord?: string;
  created_at: string;
}

interface Task {
  id: string;
  level_id: string;
  author_id: string;
  title: string;
  description?: string | null;
  required_submission_type: 'text' | 'file';
  grading_scale: number;
  created_at: string;
  author?: {
    full_name: string;
  };
}

interface Niveau {
  id: string;
  naam: string;
  class_id: string;
}

interface Klas {
  id: string;
  name: string;
}

interface TaskQuestionManagementNewProps {
  classId?: string;
  preselectedLevelId?: string;
}

const TaskQuestionManagementNew = ({ classId, preselectedLevelId }: TaskQuestionManagementNewProps) => {
  const { t } = useTranslation();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(classId || '');
  const [levelId, setLevelId] = useState<string>(preselectedLevelId || '');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [newTaskType, setNewTaskType] = useState<'text' | 'file'>('text');
  const [newTaskGradingScale, setNewTaskGradingScale] = useState<number>(10);
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Edit states
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskType, setEditTaskType] = useState<'text' | 'file'>('text');
  const [editTaskGradingScale, setEditTaskGradingScale] = useState(10);
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false);
  const [editQuestionText, setEditQuestionText] = useState('');
  
  const { profile } = useAuth();
  const { toast } = useToast();

  // Initialize from props
  useEffect(() => {
    if (classId) setSelectedClassId(classId);
    if (preselectedLevelId) setLevelId(preselectedLevelId);
  }, [classId, preselectedLevelId]);

  // Fetch teacher's classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('klassen')
        .select('id, name')
        .eq('teacher_id', profile.id)
        .order('name');
      if (error) throw error;
      return data as Klas[];
    },
    enabled: !!profile?.id,
  });

  // Fetch niveaus for selected class
  const { data: niveaus, isLoading: niveausLoading } = useQuery({
    queryKey: ['class-niveaus', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const { data, error } = await supabase
        .from('niveaus')
        .select('id, naam, class_id')
        .eq('class_id', selectedClassId)
        .order('naam');
      if (error) throw error;
      return data as Niveau[];
    },
    enabled: !!selectedClassId,
  });

  // Reset niveau when class changes
  useEffect(() => {
    if (!classId) {
      setLevelId('');
      setTasks([]);
      setQuestions([]);
    }
  }, [selectedClassId, classId]);

  // Fetch tasks and questions when niveau changes
  useEffect(() => {
    if (levelId) {
      fetchTasks(levelId);
      fetchQuestions(levelId);
    } else {
      setTasks([]);
      setQuestions([]);
    }
  }, [levelId]);

  const fetchTasks = async (niveauId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_author_id_fkey(full_name)
        `)
        .eq('level_id', niveauId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const tasksWithAuthor = data?.map(task => ({
        ...task,
        required_submission_type: task.required_submission_type || 'text' as 'text' | 'file',
        author: { full_name: task.profiles?.full_name || t('management.unknown') }
      })) || [];

      setTasks(tasksWithAuthor);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchQuestions = async (niveauId: string) => {
    try {
      const { data, error } = await supabase
        .from('vragen')
        .select('*')
        .eq('niveau_id', niveauId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedQuestions = data?.map(item => ({
        id: item.id,
        niveau_id: item.niveau_id,
        vraag: item.vraag_tekst || '',
        audio_url: item.audio_url,
        correct_antwoord: typeof item.correct_antwoord === 'string' 
          ? item.correct_antwoord 
          : JSON.stringify(item.correct_antwoord) || '',
        created_at: item.created_at,
      })) || [];

      setQuestions(mappedQuestions);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
    }
  };

  const createTask = async () => {
    if (!levelId) {
      toast({
        variant: "destructive",
        title: t('management.errorTitle'),
        description: t('management.selectLevelFirst', 'Selecteer eerst een niveau'),
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([
          {
            level_id: levelId,
            author_id: profile?.id || '',
            title: newTaskTitle,
            description: newTaskDescription || '',
            required_submission_type: newTaskType,
            grading_scale: newTaskGradingScale,
          },
        ]);

      if (error) throw error;
      toast({
        title: t('management.taskCreatedTitle'),
        description: t('management.taskCreatedDescription'),
      });
      fetchTasks(levelId);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskType('text');
      setNewTaskGradingScale(10);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('management.errorTitle'),
        description: t('management.taskErrorDescription'),
      });
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async () => {
    if (!levelId) {
      toast({
        variant: "destructive",
        title: t('management.errorTitle'),
        description: t('management.selectLevelFirst', 'Selecteer eerst een niveau'),
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vragen')
        .insert([
          {
            niveau_id: levelId,
            vraag_tekst: newQuestionText,
            vraag_type: 'open',
          },
        ]);

      if (error) throw error;
      toast({
        title: t('management.questionCreatedTitle'),
        description: t('management.questionCreatedDescription'),
      });
      fetchQuestions(levelId);
      setNewQuestionText('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('management.errorTitle'),
        description: t('management.questionErrorDescription'),
      });
      console.error('Error creating question:', error);
    } finally {
      setLoading(false);
    }
  };

  // Edit Task Functions
  const openEditTaskDialog = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskType(task.required_submission_type);
    setEditTaskGradingScale(task.grading_scale);
    setEditTaskDialogOpen(true);
  };

  const updateTask = async () => {
    if (!editingTask) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editTaskTitle,
          description: editTaskDescription || null,
          required_submission_type: editTaskType,
          grading_scale: editTaskGradingScale,
        })
        .eq('id', editingTask.id);
      
      if (error) throw error;
      
      toast({ title: t('management.taskUpdatedTitle', 'Taak bijgewerkt') });
      fetchTasks(levelId);
      setEditTaskDialogOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: t('management.errorTitle', 'Er ging iets fout'),
        description: t('management.taskUpdateError', 'Kon taak niet bijwerken')
      });
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  // Edit Question Functions
  const openEditQuestionDialog = (question: Question) => {
    setEditingQuestion(question);
    setEditQuestionText(question.vraag);
    setEditQuestionDialogOpen(true);
  };

  const updateQuestion = async () => {
    if (!editingQuestion) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vragen')
        .update({
          vraag_tekst: editQuestionText,
        })
        .eq('id', editingQuestion.id);
      
      if (error) throw error;
      
      toast({ title: t('management.questionUpdatedTitle', 'Vraag bijgewerkt') });
      fetchQuestions(levelId);
      setEditQuestionDialogOpen(false);
      setEditingQuestion(null);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: t('management.errorTitle', 'Er ging iets fout'),
        description: t('management.questionUpdateError', 'Kon vraag niet bijwerken')
      });
      console.error('Error updating question:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm(t('management.confirmDeleteTask', 'Weet je zeker dat je deze taak wilt verwijderen?'))) return;
    
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      toast({ title: t('management.taskDeletedTitle', 'Taak verwijderd') });
      fetchTasks(levelId);
    } catch (error: any) {
      toast({ variant: "destructive", title: t('management.taskDeleteError', 'Kon taak niet verwijderen') });
      console.error('Error deleting task:', error);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm(t('management.confirmDeleteQuestion', 'Weet je zeker dat je deze vraag wilt verwijderen?'))) return;
    
    try {
      const { error } = await supabase.from('vragen').delete().eq('id', questionId);
      if (error) throw error;
      toast({ title: t('management.questionDeletedTitle', 'Vraag verwijderd') });
      fetchQuestions(levelId);
    } catch (error: any) {
      toast({ variant: "destructive", title: t('management.questionDeleteError', 'Kon vraag niet verwijderen') });
      console.error('Error deleting question:', error);
    }
  };

  const handleTaskTypeChange = (value: string) => {
    setNewTaskType(value as 'text' | 'file');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('management.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Class selection */}
            <div>
              <Label htmlFor="class">{t('management.selectClass', 'Selecteer Klas')}</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('management.selectClassPlaceholder', 'Kies een klas...')} />
                </SelectTrigger>
                <SelectContent>
                  {classesLoading ? (
                    <SelectItem value="loading" disabled>{t('common.loading', 'Laden...')}</SelectItem>
                  ) : classes?.length === 0 ? (
                    <SelectItem value="empty" disabled>{t('management.noClasses', 'Geen klassen gevonden')}</SelectItem>
                  ) : (
                    classes?.map((klas) => (
                      <SelectItem key={klas.id} value={klas.id}>
                        {klas.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Niveau selection - only show when class is selected */}
            <div>
              <Label htmlFor="level">{t('management.selectLevel')}</Label>
              <Select 
                value={levelId} 
                onValueChange={setLevelId}
                disabled={!selectedClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedClassId 
                      ? t('management.selectClassFirst', 'Selecteer eerst een klas')
                      : niveausLoading 
                        ? t('common.loading', 'Laden...')
                        : t('management.selectLevelPlaceholder')
                  } />
                </SelectTrigger>
                <SelectContent>
                  {niveausLoading ? (
                    <SelectItem value="loading" disabled>{t('common.loading', 'Laden...')}</SelectItem>
                  ) : niveaus?.length === 0 ? (
                    <SelectItem value="empty" disabled>{t('management.noLevels', 'Geen niveaus - maak eerst een niveau aan')}</SelectItem>
                  ) : (
                    niveaus?.map((niveau) => (
                      <SelectItem key={niveau.id} value={niveau.id}>
                        {niveau.naam}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task and Question creation forms - only show when niveau is selected */}
          {levelId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="taskTitle">{t('management.addNewTask')}</Label>
                <Input
                  type="text"
                  id="taskTitle"
                  placeholder={t('management.taskTitle')}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <Textarea
                  className="mt-2"
                  placeholder={t('management.taskDescription')}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Label htmlFor="taskType">{t('management.type')}:</Label>
                  <Select value={newTaskType} onValueChange={handleTaskTypeChange}>
                    <SelectTrigger className="w-auto min-w-[120px]">
                      <SelectValue placeholder={t('management.selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">{t('management.text')}</SelectItem>
                      <SelectItem value="file">{t('management.file')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label htmlFor="gradingScale">{t('management.scale')}:</Label>
                  <Input
                    type="number"
                    id="gradingScale"
                    className="w-20"
                    value={newTaskGradingScale.toString()}
                    onChange={(e) => setNewTaskGradingScale(Number(e.target.value))}
                  />
                </div>
                <Button
                  className="mt-2"
                  onClick={createTask}
                  disabled={loading || !newTaskTitle}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  {loading ? t('management.loading') : t('management.createTask')}
                </Button>
              </div>

              <div>
                <Label htmlFor="questionText">{t('management.addNewQuestion')}</Label>
                <Input
                  type="text"
                  id="questionText"
                  placeholder={t('management.questionText')}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                />
                <Button
                  className="mt-2"
                  onClick={createQuestion}
                  disabled={loading || !newQuestionText}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  {loading ? t('management.loading') : t('management.createQuestion')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show existing tasks/questions only when niveau is selected */}
      {levelId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('management.existingTasks')}</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('management.noTasksForLevel', 'Geen taken voor dit niveau')}</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 border rounded-md mb-2">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('management.type')}: {task.required_submission_type === 'text' ? t('management.text') : t('management.file')}, {t('management.scale')}: {task.grading_scale}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditTaskDialog(task)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('management.existingQuestions')}</CardTitle>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('management.noQuestionsForLevel', 'Geen vragen voor dit niveau')}</p>
              ) : (
                questions.map((question) => (
                  <div key={question.id} className="flex items-center justify-between p-2 border rounded-md mb-2">
                    <p className="font-medium">{question.vraag}</p>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditQuestionDialog(question)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteQuestion(question.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('management.editTask', 'Taak Bewerken')}</DialogTitle>
            <DialogDescription>
              {t('management.editTaskDescription', 'Wijzig de gegevens van de taak')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editTaskTitle">{t('management.taskTitle')}</Label>
              <Input
                id="editTaskTitle"
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editTaskDescription">{t('management.taskDescription')}</Label>
              <Textarea
                id="editTaskDescription"
                value={editTaskDescription}
                onChange={(e) => setEditTaskDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Label>{t('management.type')}</Label>
                <Select value={editTaskType} onValueChange={(v) => setEditTaskType(v as 'text' | 'file')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">{t('management.text')}</SelectItem>
                    <SelectItem value="file">{t('management.file')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('management.scale')}</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={editTaskGradingScale}
                  onChange={(e) => setEditTaskGradingScale(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTaskDialogOpen(false)}>
              {t('common.cancel', 'Annuleren')}
            </Button>
            <Button onClick={updateTask} disabled={loading || !editTaskTitle}>
              {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t('common.save', 'Opslaan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={editQuestionDialogOpen} onOpenChange={setEditQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('management.editQuestion', 'Vraag Bewerken')}</DialogTitle>
            <DialogDescription>
              {t('management.editQuestionDescription', 'Wijzig de vraagtekst')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editQuestionText">{t('management.questionText')}</Label>
              <Textarea
                id="editQuestionText"
                value={editQuestionText}
                onChange={(e) => setEditQuestionText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditQuestionDialogOpen(false)}>
              {t('common.cancel', 'Annuleren')}
            </Button>
            <Button onClick={updateQuestion} disabled={loading || !editQuestionText}>
              {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t('common.save', 'Opslaan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskQuestionManagementNew;