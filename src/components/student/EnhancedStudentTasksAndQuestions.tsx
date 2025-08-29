
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Radio, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { StudentTaskSubmissionCard } from './StudentTaskSubmissionCard';
import { StudentQuestionCard } from './StudentQuestionCard';
import { useTaskStore } from '@/hooks/useTaskStore';

interface Task {
  id: string;
  level_id: string;
  title: string;
  description?: string;
  required_submission_type: 'text' | 'file';
  grading_scale: number;
  created_at: string;
  author?: {
    full_name: string;
  };
}

interface TaskSubmission {
  id: string;
  task_id: string;
  student_id: string;
  submission_content?: string;
  submission_file_path?: string;
  grade?: number;
  feedback?: string;
  submitted_at: string;
}

interface Question {
  id: string;
  niveau_id: string;
  vraag: string;
  audio_url?: string;
  correct_antwoord?: string;
  created_at: string;
  answer?: {
    id: string;
    antwoord: string;
    is_correct: boolean;
    punten: number;
    feedback: string;
    created_at: string;
  };
}

interface EnhancedStudentTasksAndQuestionsProps {
  levelId: string;
  levelName: string;
}

export const EnhancedStudentTasksAndQuestions = ({ 
  levelId, 
  levelName 
}: EnhancedStudentTasksAndQuestionsProps) => {
  const { profile } = useAuth();
  const { submitTask } = useTaskStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (levelId && profile?.id) {
      loadContent();
    }
  }, [levelId, profile?.id]);

  const loadContent = async () => {
    setLoading(true);
    await Promise.all([
      fetchTasks(),
      fetchQuestions()
    ]);
    setLoading(false);
  };

  const fetchTasks = async () => {
    try {
      // Fetch tasks for this level
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_author_id_fkey(full_name)
        `)
        .eq('level_id', levelId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const formattedTasks = tasksData?.map(task => ({
        ...task,
        author: { full_name: task.profiles?.full_name || 'Onbekend' }
      })) || [];

      setTasks(formattedTasks);

      // Fetch submissions for these tasks
      if (formattedTasks.length > 0) {
        const taskIds = formattedTasks.map(t => t.id);
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('task_submissions')
          .select('*')
          .in('task_id', taskIds)
          .eq('student_id', profile?.id);

        if (submissionsError) throw submissionsError;
        setTaskSubmissions(submissionsData || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      let query = supabase
        .from('vragen')
        .select(`
          id,
          niveau_id,
          vraag_tekst,
          audio_url,
          correct_antwoord,
          created_at,
          antwoorden!left (
            id,
            antwoord,
            is_correct,
            punten,
            feedback,
            created_at
          )
        `)
        .eq('niveau_id', levelId)
        .order('created_at', { ascending: false });

      if (profile?.id) {
        query = query.eq('antwoorden.student_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedQuestions = data?.map(q => ({
        id: q.id,
        niveau_id: q.niveau_id,
        vraag: q.vraag_tekst || '',
        audio_url: q.audio_url,
        correct_antwoord: typeof q.correct_antwoord === 'string' 
          ? q.correct_antwoord 
          : JSON.stringify(q.correct_antwoord) || '',
        created_at: q.created_at,
        answer: q.antwoorden?.[0] ? {
          ...q.antwoorden[0],
          antwoord: typeof q.antwoorden[0].antwoord === 'string'
            ? q.antwoorden[0].antwoord
            : JSON.stringify(q.antwoorden[0].antwoord) || ''
        } : undefined
      })) || [];

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleTaskSubmission = async (taskId: string, content?: string, filePath?: string) => {
    const success = await submitTask(taskId, content, filePath);
    if (success) {
      await fetchTasks(); // Refresh to show the submission
    }
  };

  const handleQuestionSubmission = async (questionId: string, answer: string) => {
    try {
      const { error } = await supabase
        .from('antwoorden')
        .insert({
          vraag_id: questionId,
          student_id: profile?.id,
          antwoord: answer
        });

      if (error) throw error;
      await fetchQuestions(); // Refresh to show the answer
    } catch (error) {
      console.error('Error submitting question answer:', error);
    }
  };

  const getTaskSubmission = (taskId: string) => {
    return taskSubmissions.find(sub => sub.task_id === taskId);
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const submitted = taskSubmissions.length;
    const graded = taskSubmissions.filter(sub => sub.grade !== null).length;
    return { total, submitted, graded };
  };

  const getQuestionStats = () => {
    const total = questions.length;
    const answered = questions.filter(q => q.answer).length;
    const graded = questions.filter(q => q.answer?.punten !== null).length;
    return { total, answered, graded };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const taskStats = getTaskStats();
  const questionStats = getQuestionStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inhoud voor {levelName}</h2>
        <div className="flex gap-2">
          <Badge variant="outline">
            Taken: {taskStats.submitted}/{taskStats.total}
          </Badge>
          <Badge variant="outline">
            Vragen: {questionStats.answered}/{questionStats.total}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Taken ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Vragen ({questions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6 space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Geen taken beschikbaar voor dit niveau.
                </p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <StudentTaskSubmissionCard
                key={task.id}
                task={task}
                submission={getTaskSubmission(task.id)}
                onSubmit={handleTaskSubmission}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="questions" className="mt-6 space-y-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Geen vragen beschikbaar voor dit niveau.
                </p>
              </CardContent>
            </Card>
          ) : (
            questions.map((question) => (
              <StudentQuestionCard
                key={question.id}
                question={question}
                onSubmit={handleQuestionSubmission}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
