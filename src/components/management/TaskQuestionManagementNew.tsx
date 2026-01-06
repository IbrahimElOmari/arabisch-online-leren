import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2 } from 'lucide-react';

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

const TaskQuestionManagementNew = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [levelId, setLevelId] = useState<string>('level-1');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [newTaskType, setNewTaskType] = useState<'text' | 'file'>('text');
  const [newTaskGradingScale, setNewTaskGradingScale] = useState<number>(10);
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast()

  useEffect(() => {
    if (levelId) {
      fetchTasks(levelId);
      fetchQuestions(levelId);
    }
  }, [levelId]);

  const fetchTasks = async (levelId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_author_id_fkey(full_name)
        `)
        .eq('level_id', levelId)
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

  const fetchQuestions = async (levelId: string) => {
    try {
      const { data, error } = await supabase
        .from('vragen')
        .select('*')
        .eq('niveau_id', levelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to interface
      const mappedQuestions = data?.map(item => ({
        id: item.id,
        niveau_id: item.niveau_id,
        vraag: item.vraag_tekst || '', // Map vraag_tekst to vraag
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
      })
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
      })
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vragen')
        .insert([
          {
            niveau_id: levelId,
            vraag_tekst: newQuestionText, // Use correct database field name
            vraag_type: 'text', // Add required field
          },
        ]);

      if (error) throw error;
      toast({
        title: t('management.questionCreatedTitle'),
        description: t('management.questionCreatedDescription'),
      })
      fetchQuestions(levelId);
      setNewQuestionText('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('management.errorTitle'),
        description: t('management.questionErrorDescription'),
      })
      console.error('Error creating question:', error);
    } finally {
      setLoading(false);
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
            <div>
              <Label htmlFor="level">{t('management.selectLevel')}</Label>
              <Select value={levelId} onValueChange={setLevelId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('management.selectLevelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="level-1">{t('management.level')} 1</SelectItem>
                  <SelectItem value="level-2">{t('management.level')} 2</SelectItem>
                  <SelectItem value="level-3">{t('management.level')} 3</SelectItem>
                  <SelectItem value="level-4">{t('management.level')} 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                disabled={loading}
              >
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
                disabled={loading}
              >
                {loading ? t('management.loading') : t('management.createQuestion')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('management.existingTasks')}</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.map((task) => (
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
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('management.existingQuestions')}</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.map((question) => (
              <div key={question.id} className="flex items-center justify-between p-2 border rounded-md mb-2">
                <p className="font-medium">{question.vraag}</p>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskQuestionManagementNew;
