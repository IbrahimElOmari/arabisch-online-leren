import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  Star,
  Upload,
  Play,
  Video,
  Mic
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string;
  required_submission_type: 'text' | 'file';
  grading_scale: number;
  created_at: string;
  submission?: {
    id: string;
    submission_content?: string;
    submission_file_path?: string;
    grade?: number;
    feedback?: string;
    submitted_at: string;
  };
}

interface Question {
  id: string;
  vraag_tekst: string;
  vraag_type: string;
  created_at: string;
  opties?: any;
  correct_antwoord?: any;
  answer?: {
    id: string;
    antwoord: string;
    is_correct?: boolean;
    punten?: number;
    feedback?: string;
    created_at: string;
  };
}

export const StudentTasksAndQuestions = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionData, setSubmissionData] = useState<{[key: string]: string}>({});
  const [answerData, setAnswerData] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (profile?.id) {
      fetchTasksAndQuestions();
    }
  }, [profile?.id]);

  const fetchTasksAndQuestions = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Fetch tasks from enrolled classes
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_submissions!left (
            id,
            submission_content,
            submission_file_path,
            grade,
            feedback,
            submitted_at
          ),
          niveaus!inner (
            id,
            klassen!inner (
              id,
              inschrijvingen!inner (
                student_id,
                payment_status
              )
            )
          )
        `)
        .eq('niveaus.klassen.inschrijvingen.student_id', profile.id)
        .eq('niveaus.klassen.inschrijvingen.payment_status', 'paid')
        .eq('task_submissions.student_id', profile.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch questions from enrolled classes
      const { data: questionsData, error: questionsError } = await supabase
        .from('vragen')
        .select(`
          *,
          antwoorden!left (
            id,
            antwoord,
            is_correct,
            punten,
            feedback,
            created_at
          ),
          niveaus!inner (
            id,
            klassen!inner (
              id,
              inschrijvingen!inner (
                student_id,
                payment_status
              )
            )
          )
        `)
        .eq('niveaus.klassen.inschrijvingen.student_id', profile.id)
        .eq('niveaus.klassen.inschrijvingen.payment_status', 'paid')
        .eq('antwoorden.student_id', profile.id)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      // Process tasks
      const processedTasks = (tasksData || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        required_submission_type: task.required_submission_type,
        grading_scale: task.grading_scale,
        created_at: task.created_at,
        submission: task.task_submissions?.[0] || null
      }));

      // Process questions - handle Json to string conversion
      const processedQuestions = (questionsData || []).map(question => ({
        id: question.id,
        vraag_tekst: question.vraag_tekst,
        vraag_type: question.vraag_type,
        created_at: question.created_at,
        opties: question.opties,
        correct_antwoord: question.correct_antwoord,
        answer: question.antwoorden?.[0] ? {
          id: question.antwoorden[0].id,
          antwoord: typeof question.antwoorden[0].antwoord === 'string' 
            ? question.antwoorden[0].antwoord 
            : JSON.stringify(question.antwoorden[0].antwoord),
          is_correct: question.antwoorden[0].is_correct,
          punten: question.antwoorden[0].punten,
          feedback: question.antwoorden[0].feedback,
          created_at: question.antwoorden[0].created_at
        } : null
      }));

      setTasks(processedTasks);
      setQuestions(processedQuestions);
    } catch (error) {
      console.error('Error fetching tasks and questions:', error);
      toast.error('Fout bij het ophalen van opdrachten en vragen');
    } finally {
      setLoading(false);
    }
  };

  const submitTask = async (taskId: string, type: 'text' | 'file') => {
    const content = submissionData[taskId];
    if (!content?.trim()) {
      toast.error('Vul je antwoord in');
      return;
    }

    try {
      let submissionContent = null;
      let submissionFilePath = null;

      if (type === 'text') {
        submissionContent = content;
      } else {
        // For file submissions, content should be a file path or URL
        submissionFilePath = content;
      }

      const { error } = await supabase.functions.invoke('manage-task', {
        body: {
          action: 'submit-task',
          taskId,
          submissionContent,
          submissionFilePath
        }
      });

      if (error) throw error;

      toast.success('Opdracht ingediend');
      setSubmissionData(prev => ({ ...prev, [taskId]: '' }));
      fetchTasksAndQuestions();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Fout bij indienen opdracht');
    }
  };

  const submitAnswer = async (questionId: string) => {
    const answer = answerData[questionId];
    if (!answer?.trim()) {
      toast.error('Vul je antwoord in');
      return;
    }

    try {
      const { error } = await supabase
        .from('antwoorden')
        .insert({
          vraag_id: questionId,
          student_id: profile?.id,
          antwoord: answer
        });

      if (error) throw error;

      toast.success('Antwoord ingediend');
      setAnswerData(prev => ({ ...prev, [questionId]: '' }));
      fetchTasksAndQuestions();
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Fout bij indienen antwoord');
    }
  };

  const getTaskStatus = (task: Task) => {
    if (task.submission) {
      if (task.submission.grade !== null) {
        return { status: 'graded', label: 'Beoordeeld', variant: 'default' as const };
      }
      return { status: 'submitted', label: 'Ingediend', variant: 'secondary' as const };
    }
    return { status: 'open', label: 'Te maken', variant: 'destructive' as const };
  };

  const getQuestionStatus = (question: Question) => {
    if (question.answer) {
      if (question.answer.is_correct !== null) {
        return { status: 'graded', label: 'Beoordeeld', variant: 'default' as const };
      }
      return { status: 'submitted', label: 'Beantwoord', variant: 'secondary' as const };
    }
    return { status: 'open', label: 'Te beantwoorden', variant: 'destructive' as const };
  };

  const renderQuestionInput = (question: Question) => {
    if (question.answer) return null;

    switch (question.vraag_type) {
      case 'upload':
      case 'bestand':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // In a real implementation, you'd upload this file first
                  setAnswerData(prev => ({ ...prev, [question.id]: file.name }));
                }
              }}
            />
            <Button 
              onClick={() => submitAnswer(question.id)}
              disabled={!answerData[question.id]}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bestand Uploaden
            </Button>
          </div>
        );
      
      case 'audio':
        return (
          <div className="space-y-2">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <Mic className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Audio opname functionaliteit</p>
              <p className="text-xs text-gray-400">Nog niet geïmplementeerd</p>
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <Video className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Video opname functionaliteit</p>
              <p className="text-xs text-gray-400">Nog niet geïmplementeerd</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <Textarea
              placeholder="Typ je antwoord hier..."
              value={answerData[question.id] || ''}
              onChange={(e) => setAnswerData(prev => ({ ...prev, [question.id]: e.target.value }))}
              rows={4}
            />
            <Button 
              onClick={() => submitAnswer(question.id)}
              disabled={!answerData[question.id]?.trim()}
              className="w-full"
            >
              Antwoord Versturen
            </Button>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  // Categorize tasks and questions
  const openTasks = tasks.filter(t => getTaskStatus(t).status === 'open');
  const submittedTasks = tasks.filter(t => getTaskStatus(t).status === 'submitted');
  const gradedTasks = tasks.filter(t => getTaskStatus(t).status === 'graded');

  const openQuestions = questions.filter(q => getQuestionStatus(q).status === 'open');
  const submittedQuestions = questions.filter(q => getQuestionStatus(q).status === 'submitted');
  const gradedQuestions = questions.filter(q => getQuestionStatus(q).status === 'graded');

  return (
    <div className="space-y-6">
      <div className="main-content-card">
        <h2 className="text-2xl font-bold mb-6">Mijn Opdrachten en Vragen</h2>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="open">
              Te Maken ({openTasks.length + openQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Ingediend ({submittedTasks.length + submittedQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="graded">
              Beoordeeld ({gradedTasks.length + gradedQuestions.length})
            </TabsTrigger>
          </TabsList>

          {/* Open Tasks and Questions */}
          <TabsContent value="open" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Open Tasks */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Opdrachten ({openTasks.length})
                </h3>
                {openTasks.map((task) => (
                  <Card key={task.id} className="floating-content mb-3">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Max: {task.grading_scale} punten
                          </p>
                        </div>
                        <Badge variant="destructive">Te maken</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.required_submission_type === 'text' ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Typ je antwoord hier..."
                            value={submissionData[task.id] || ''}
                            onChange={(e) => setSubmissionData(prev => ({ ...prev, [task.id]: e.target.value }))}
                            rows={4}
                          />
                          <Button 
                            onClick={() => submitTask(task.id, 'text')}
                            disabled={!submissionData[task.id]?.trim()}
                            className="w-full"
                          >
                            Opdracht Indienen
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSubmissionData(prev => ({ ...prev, [task.id]: file.name }));
                              }
                            }}
                          />
                          <Button 
                            onClick={() => submitTask(task.id, 'file')}
                            disabled={!submissionData[task.id]}
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Bestand Uploaden
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {openTasks.length === 0 && (
                  <Card className="floating-content">
                    <CardContent className="text-center py-4">
                      <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                      <p className="text-sm text-muted-foreground">Alle opdrachten zijn gemaakt!</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Open Questions */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Vragen ({openQuestions.length})
                </h3>
                {openQuestions.map((question) => (
                  <Card key={question.id} className="floating-content mb-3">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{question.vraag_tekst}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {question.vraag_type}
                          </p>
                        </div>
                        <Badge variant="destructive">Te beantwoorden</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {renderQuestionInput(question)}
                    </CardContent>
                  </Card>
                ))}
                {openQuestions.length === 0 && (
                  <Card className="floating-content">
                    <CardContent className="text-center py-4">
                      <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                      <p className="text-sm text-muted-foreground">Alle vragen zijn beantwoord!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Submitted Tab */}
          <TabsContent value="submitted" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Submitted Tasks */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ingediende Opdrachten ({submittedTasks.length})
                </h3>
                {submittedTasks.map((task) => (
                  <Card key={task.id} className="floating-content mb-3">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ingediend: {formatDistanceToNow(new Date(task.submission!.submitted_at), { 
                              addSuffix: true, 
                              locale: nl 
                            })}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Wachten op beoordeling
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.submission?.submission_content && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{task.submission.submission_content}</p>
                        </div>
                      )}
                      {task.submission?.submission_file_path && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">📎 {task.submission.submission_file_path}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Submitted Questions */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Beantwoorde Vragen ({submittedQuestions.length})
                </h3>
                {submittedQuestions.map((question) => (
                  <Card key={question.id} className="floating-content mb-3">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-2">{question.vraag_tekst}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            Beantwoord: {formatDistanceToNow(new Date(question.answer!.created_at), { 
                              addSuffix: true, 
                              locale: nl 
                            })}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Wachten op beoordeling
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{question.answer?.antwoord}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Graded Tab */}
          <TabsContent value="graded" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graded Tasks */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Beoordeelde Opdrachten ({gradedTasks.length})
                </h3>
                {gradedTasks.map((task) => (
                  <Card key={task.id} className="floating-content mb-3">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            Beoordeeld: {formatDistanceToNow(new Date(task.submission!.submitted_at), { 
                              addSuffix: true, 
                              locale: nl 
                            })}
                          </p>
                        </div>
                        <Badge variant="default">
                          <Star className="w-3 h-3 mr-1" />
                          {task.submission?.grade}/{task.grading_scale}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.submission?.submission_content && (
                        <div className="p-3 bg-muted rounded-lg mb-3">
                          <p className="text-sm font-medium mb-1">Je antwoord:</p>
                          <p className="text-sm">{task.submission.submission_content}</p>
                        </div>
                      )}
                      {task.submission?.feedback && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Feedback:</p>
                          <p className="text-sm">{task.submission.feedback}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Graded Questions */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Beoordeelde Vragen ({gradedQuestions.length})
                </h3>
                {gradedQuestions.map((question) => (
                  <Card key={question.id} className="floating-content mb-3">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-2">{question.vraag_tekst}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            Beoordeeld: {formatDistanceToNow(new Date(question.answer!.created_at), { 
                              addSuffix: true, 
                              locale: nl 
                            })}
                          </p>
                        </div>
                        <Badge variant={question.answer?.is_correct ? "default" : "destructive"}>
                          <Star className="w-3 h-3 mr-1" />
                          {question.answer?.punten || 0} pts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="p-3 bg-muted rounded-lg mb-3">
                        <p className="text-sm font-medium mb-1">Je antwoord:</p>
                        <p className="text-sm">{question.answer?.antwoord}</p>
                      </div>
                      {question.answer?.feedback && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Feedback:</p>
                          <p className="text-sm">{question.answer.feedback}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
