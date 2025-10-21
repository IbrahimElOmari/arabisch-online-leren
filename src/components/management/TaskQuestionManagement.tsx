import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  HelpCircle, 
  Eye, 
  Users, 
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  grading_scale: number;
  niveaus: {
    naam: string;
    klassen: {
      name: string;
    };
  };
  _count?: {
    task_submissions: number;
  };
  submissions_info?: {
    total: number;
    graded: number;
    pending: number;
  };
}

interface Question {
  id: string;
  vraag_tekst: string;
  vraag_type: string;
  created_at: string;
  niveaus: {
    naam: string;
    klassen: {
      name: string;
    };
  };
  _count?: {
    antwoorden: number;
  };
  answers_info?: {
    total: number;
    graded: number;
    pending: number;
  };
}

export const TaskQuestionManagement = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasksAndQuestions();
  }, [profile?.id]);

  const fetchTasksAndQuestions = async () => {
    if (!profile?.id) return;

    try {
      // Fetch tasks created by this teacher
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          created_at,
          grading_scale,
          niveaus:level_id (
            naam,
            klassen:class_id (
              name,
              teacher_id
            )
          )
        `)
        .eq('niveaus.klassen.teacher_id', profile.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch questions created by this teacher
      const { data: questionsData, error: questionsError } = await supabase
        .from('vragen')
        .select(`
          id,
          vraag_tekst,
          vraag_type,
          created_at,
          niveaus:niveau_id (
            naam,
            klassen:class_id (
              name,
              teacher_id
            )
          )
        `)
        .eq('niveaus.klassen.teacher_id', profile.id)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      // Fetch submission counts for tasks
      const tasksWithCounts = await Promise.all(
        (tasksData || []).map(async (task) => {
          const { data: submissions, error } = await supabase
            .from('task_submissions')
            .select('id, grade')
            .eq('task_id', task.id);

          if (error) {
            console.error('Error fetching submissions for task:', task.id, error);
            return task;
          }

          const total = submissions?.length || 0;
          const graded = submissions?.filter(s => s.grade !== null).length || 0;
          const pending = total - graded;

          return {
            ...task,
            submissions_info: {
              total,
              graded,
              pending
            }
          };
        })
      );

      // Fetch answer counts for questions
      const questionsWithCounts = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { data: answers, error } = await supabase
            .from('antwoorden')
            .select('id, is_correct')
            .eq('vraag_id', question.id);

          if (error) {
            console.error('Error fetching answers for question:', question.id, error);
            return question;
          }

          const total = answers?.length || 0;
          const graded = answers?.filter(a => a.is_correct !== null).length || 0;
          const pending = total - graded;

          return {
            ...question,
            answers_info: {
              total,
              graded,
              pending
            }
          };
        })
      );

      setTasks(tasksWithCounts);
      setQuestions(questionsWithCounts);
    } catch (error) {
      console.error('Error fetching tasks and questions:', error);
      toast.error('Fout bij het ophalen van taken en vragen');
    } finally {
      setLoading(false);
    }
  };

  const viewTaskSubmissions = async (taskId: string, taskTitle: string) => {
    try {
      const { data: submissions, error } = await supabase
        .from('task_submissions')
        .select(`
          id,
          student_id,
          submission_content,
          submission_file_path,
          grade,
          feedback,
          submitted_at,
          profiles:student_id (full_name)
        `)
        .eq('task_id', taskId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Show submissions in a modal or new view
      if (import.meta.env.DEV) {
        console.log('Task submissions:', submissions);
      }
      toast.success(`${submissions?.length || 0} inzendingen gevonden voor "${taskTitle}"`);
    } catch (error) {
      console.error('Error fetching task submissions:', error);
      toast.error('Fout bij het ophalen van inzendingen');
    }
  };

  const viewQuestionAnswers = async (questionId: string) => {
    try {
      const { data: answers, error } = await supabase
        .from('antwoorden')
        .select(`
          id,
          student_id,
          antwoord,
          is_correct,
          punten,
          feedback,
          created_at,
          profiles:student_id (full_name)
        `)
        .eq('vraag_id', questionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Show answers in a modal or new view
      if (import.meta.env.DEV) {
        console.log('Question answers:', answers);
      }
      toast.success(`${answers?.length || 0} antwoorden gevonden voor de vraag`);
    } catch (error) {
      console.error('Error fetching question answers:', error);
      toast.error('Fout bij het ophalen van antwoorden');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="@container">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">Overzicht Taken en Vragen</h2>
        
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">
              Opdrachten ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="questions">
              Vragen ({questions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="floating-content">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {task.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.niveaus.klassen.name} - {task.niveaus.naam}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Aangemaakt {formatDistanceToNow(new Date(task.created_at), { 
                          addSuffix: true, 
                          locale: nl 
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={task.submissions_info?.pending ? "destructive" : "default"}>
                        {task.submissions_info?.pending || 0} te beoordelen
                      </Badge>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>Schaal: 0-{task.grading_scale}</div>
                        <div>{task.submissions_info?.total || 0} inzendingen</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {task.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="p-2 bg-blue-50 rounded-md">
                      <div className="text-lg font-semibold text-blue-600">
                        {task.submissions_info?.total || 0}
                      </div>
                      <div className="text-xs text-blue-600">Totaal</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded-md">
                      <div className="text-lg font-semibold text-green-600">
                        {task.submissions_info?.graded || 0}
                      </div>
                      <div className="text-xs text-green-600">Beoordeeld</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-md">
                      <div className="text-lg font-semibold text-orange-600">
                        {task.submissions_info?.pending || 0}
                      </div>
                      <div className="text-xs text-orange-600">Wachten</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewTaskSubmissions(task.id, task.title)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 me-2" />
                      Bekijk Inzendingen
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewTaskSubmissions(task.id, task.title)}
                    >
                      <Users className="w-4 h-4 me-2" />
                      Leerlingen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {tasks.length === 0 && (
              <Card className="floating-content">
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nog geen opdrachten aangemaakt</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
            {questions.map((question) => (
              <Card key={question.id} className="floating-content">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        <span className="line-clamp-1">{question.vraag_tekst}</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {question.niveaus.klassen.name} - {question.niveaus.naam}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Aangemaakt {formatDistanceToNow(new Date(question.created_at), { 
                          addSuffix: true, 
                          locale: nl 
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={question.answers_info?.pending ? "destructive" : "default"}>
                        {question.answers_info?.pending || 0} te beoordelen
                      </Badge>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>Type: {question.vraag_type}</div>
                        <div>{question.answers_info?.total || 0} antwoorden</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="p-2 bg-blue-50 rounded-md">
                      <div className="text-lg font-semibold text-blue-600">
                        {question.answers_info?.total || 0}
                      </div>
                      <div className="text-xs text-blue-600">Totaal</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded-md">
                      <div className="text-lg font-semibold text-green-600">
                        {question.answers_info?.graded || 0}
                      </div>
                      <div className="text-xs text-green-600">Beoordeeld</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-md">
                      <div className="text-lg font-semibold text-orange-600">
                        {question.answers_info?.pending || 0}
                      </div>
                      <div className="text-xs text-orange-600">Wachten</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                    onClick={() => viewQuestionAnswers(question.id)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 me-2" />
                      Bekijk Antwoorden
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewQuestionAnswers(question.id)}
                    >
                      <Users className="w-4 h-4 me-2" />
                      Leerlingen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {questions.length === 0 && (
              <Card className="floating-content">
                <CardContent className="text-center py-8">
                  <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nog geen vragen aangemaakt</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
