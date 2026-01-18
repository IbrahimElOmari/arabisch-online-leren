import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    setLevelId('');
    setTasks([]);
    setQuestions([]);
  }, [selectedClassId]);

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
        description: 'Selecteer eerst een niveau',
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
        description: 'Selecteer eerst een niveau',
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

  const deleteTask = async (taskId: string) => {
    if (!confirm('Weet je zeker dat je deze taak wilt verwijderen?')) return;
    
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      toast({ title: 'Taak verwijderd' });
      fetchTasks(levelId);
    } catch (error: any) {
      toast({ variant: "destructive", title: 'Kon taak niet verwijderen' });
      console.error('Error deleting task:', error);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Weet je zeker dat je deze vraag wilt verwijderen?')) return;
    
    try {
      const { error } = await supabase.from('vragen').delete().eq('id', questionId);
      if (error) throw error;
      toast({ title: 'Vraag verwijderd' });
      fetchQuestions(levelId);
    } catch (error: any) {
      toast({ variant: "destructive", title: 'Kon vraag niet verwijderen' });
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
                    <SelectItem value="loading" disabled>Laden...</SelectItem>
                  ) : classes?.length === 0 ? (
                    <SelectItem value="empty" disabled>Geen klassen gevonden</SelectItem>
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
                      ? 'Selecteer eerst een klas' 
                      : niveausLoading 
                        ? 'Laden...' 
                        : t('management.selectLevelPlaceholder')
                  } />
                </SelectTrigger>
                <SelectContent>
                  {niveausLoading ? (
                    <SelectItem value="loading" disabled>Laden...</SelectItem>
                  ) : niveaus?.length === 0 ? (
                    <SelectItem value="empty" disabled>Geen niveaus - maak eerst een niveau aan</SelectItem>
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
                <p className="text-sm text-muted-foreground">Geen taken voor dit niveau</p>
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
                      <Button size="icon" variant="ghost">
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
                <p className="text-sm text-muted-foreground">Geen vragen voor dit niveau</p>
              ) : (
                questions.map((question) => (
                  <div key={question.id} className="flex items-center justify-between p-2 border rounded-md mb-2">
                    <p className="font-medium">{question.vraag}</p>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost">
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
    </div>
  );
};

export default TaskQuestionManagementNew;
