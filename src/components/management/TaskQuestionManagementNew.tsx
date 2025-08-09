import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  HelpCircle, 
  Eye, 
  Users, 
  CheckCircle, 
  Clock,
  Calendar,
  BookOpen,
  Star,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { TaskSubmissionModal } from '@/components/tasks/TaskSubmissionModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Task {
  id: string;
  title: string;
  description: string;
  created_at: string;
  grading_scale: number;
  level_id: string;
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
  niveau_id: string;
  answers_info?: {
    total: number;
    graded: number;
    pending: number;
  };
}

interface ClassData {
  id: string;
  name: string;
  description: string;
}

interface Level {
  id: string;
  naam: string;
  niveau_nummer: number;
  class_id: string;
}

interface Submission {
  id: string;
  task_id: string;
  student_id: string;
  submission_content?: string;
  submission_file_path?: string;
  grade?: number;
  feedback?: string;
  submitted_at: string;
  student?: {
    full_name: string;
  };
}

interface Answer {
  id: string;
  vraag_id: string;
  student_id: string;
  antwoord: string;
  is_correct?: boolean;
  punten?: number;
  feedback?: string;
  created_at: string;
  student?: {
    full_name: string;
  };
}

export const TaskQuestionManagementNew = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionModal, setSubmissionModal] = useState<{
    open: boolean;
    taskId: string;
    taskTitle: string;
  }>({ open: false, taskId: '', taskTitle: '' });
  const [answerModal, setAnswerModal] = useState<{
    open: boolean;
    questionId: string;
    questionText: string;
  }>({ open: false, questionId: '', questionText: '' });

  useEffect(() => {
    fetchClasses();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedClass) {
      fetchLevels();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedLevel) {
      fetchTasksAndQuestions();
    }
  }, [selectedClass, selectedLevel]);

  const fetchClasses = async () => {
    if (!profile?.id) return;

    try {
      let query = supabase.from('klassen').select('id, name, description');
      
      // If user is a teacher, only show their assigned classes
      if (profile.role && ['teacher', 'leerkracht'].includes(profile.role)) {
        query = query.eq('teacher_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
      
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Fout bij het ophalen van klassen');
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    if (!selectedClass) return;

    try {
      const { data, error } = await supabase
        .from('niveaus')
        .select('*')
        .eq('class_id', selectedClass)
        .order('niveau_nummer', { ascending: true });

      if (error) throw error;
      setLevels(data || []);
      
      if (data && data.length > 0) {
        setSelectedLevel(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const fetchTasksAndQuestions = async () => {
    if (!selectedLevel) return;

    try {
      // Fetch tasks for the selected level
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('level_id', selectedLevel)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch questions for the selected level
      const { data: questionsData, error: questionsError } = await supabase
        .from('vragen')
        .select('*')
        .eq('niveau_id', selectedLevel)
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
    }
  };

  const viewTaskSubmissions = async (taskId: string, taskTitle: string) => {
    try {
      const { data: submissions, error } = await supabase
        .from('task_submissions')
        .select(`
          id,
          task_id,
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

      const formattedSubmissions = (submissions || []).map(submission => ({
        ...submission,
        student: submission.profiles ? { full_name: submission.profiles.full_name } : undefined
      }));
      setSubmissions(formattedSubmissions);
      setSubmissionModal({ open: true, taskId, taskTitle });
    } catch (error) {
      console.error('Error fetching task submissions:', error);
      toast.error('Fout bij het ophalen van inzendingen');
    }
  };

  const viewQuestionAnswers = async (questionId: string, questionText: string) => {
    try {
      const { data: answers, error } = await supabase
        .from('antwoorden')
        .select(`
          id,
          vraag_id,
          student_id,
          antwoord,
          is_correct,
          punten,
          feedback,
          created_at,
          profiles!antwoorden_student_id_fkey (full_name)
        `)
        .eq('vraag_id', questionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAnswers = (answers || []).map(answer => ({
        ...answer,
        antwoord: typeof answer.antwoord === 'string' ? answer.antwoord : String(answer.antwoord),
        student: answer.profiles ? { full_name: answer.profiles.full_name } : undefined
      }));
      setAnswers(formattedAnswers);
      setAnswerModal({ open: true, questionId, questionText });
    } catch (error) {
      console.error('Error fetching question answers:', error);
      toast.error('Fout bij het ophalen van antwoorden');
    }
  };

  const gradeSubmission = async (submissionId: string, grade: number, feedback?: string) => {
    try {
      const { error } = await supabase
        .from('task_submissions')
        .update({ grade, feedback })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success('Beoordeling opgeslagen');
      // Refresh submissions
      if (submissionModal.taskId) {
        viewTaskSubmissions(submissionModal.taskId, submissionModal.taskTitle);
      }
      // Refresh tasks to update counts
      fetchTasksAndQuestions();
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Fout bij het opslaan van beoordeling');
    }
  };

  const gradeAnswer = async (answerId: string, isCorrect: boolean, points: number, feedback?: string) => {
    try {
      const { error } = await supabase
        .from('antwoorden')
        .update({ is_correct: isCorrect, punten: points, feedback })
        .eq('id', answerId);

      if (error) throw error;

      toast.success('Beoordeling opgeslagen');
      // Refresh answers
      if (answerModal.questionId) {
        viewQuestionAnswers(answerModal.questionId, answerModal.questionText);
      }
      // Refresh questions to update counts
      fetchTasksAndQuestions();
    } catch (error) {
      console.error('Error grading answer:', error);
      toast.error('Fout bij het opslaan van beoordeling');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';
  const selectedLevelName = levels.find(l => l.id === selectedLevel)?.naam || '';

  // Filter tasks and questions for grading view (only those with pending items)
  const tasksForGrading = tasks.filter(task => (task.submissions_info?.pending || 0) > 0);
  const questionsForGrading = questions.filter(question => (question.answers_info?.pending || 0) > 0);

  return (
    <div className="space-y-6">
      <div className="main-content-card">
        <h2 className="text-2xl font-bold mb-6">Overzicht Taken en Vragen</h2>
        
        {/* Class and Level Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Klas- en Niveauselectie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecteer Klas</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies een klas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((klas) => (
                      <SelectItem key={klas.id} value={klas.id}>
                        {klas.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Selecteer Niveau</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies een niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.naam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedClass && selectedLevel && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium flex items-center gap-2">
                  <span>Actief:</span>
                  <Badge variant="outline">{selectedClassName} - {selectedLevelName}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedClass && selectedLevel && (
          <Tabs defaultValue="grading" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grading">
                Beoordelen ({tasksForGrading.length + questionsForGrading.length})
              </TabsTrigger>
              <TabsTrigger value="overview">
                Overzicht ({tasks.length + questions.length})
              </TabsTrigger>
            </TabsList>
            
            {/* Grading Tab - Only items that need grading */}
            <TabsContent value="grading" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tasks needing grading */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Opdrachten te Beoordelen ({tasksForGrading.length})
                  </h3>
                  {tasksForGrading.map((task) => (
                    <Card key={task.id} className="floating-content mb-3">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{task.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(task.created_at), { 
                                addSuffix: true, 
                                locale: nl 
                              })}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            {task.submissions_info?.pending || 0} te beoordelen
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewTaskSubmissions(task.id, task.title)}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Bekijk & Beoordeel
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {tasksForGrading.length === 0 && (
                    <Card className="floating-content">
                      <CardContent className="text-center py-4">
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                        <p className="text-sm text-muted-foreground">Alle opdrachten zijn beoordeeld</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Questions needing grading */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Vragen te Beoordelen ({questionsForGrading.length})
                  </h3>
                  {questionsForGrading.map((question) => (
                    <Card key={question.id} className="floating-content mb-3">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-2">{question.vraag_tekst}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(question.created_at), { 
                                addSuffix: true, 
                                locale: nl 
                              })}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            {question.answers_info?.pending || 0} te beoordelen
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewQuestionAnswers(question.id, question.vraag_tekst)}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Bekijk & Beoordeel
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {questionsForGrading.length === 0 && (
                    <Card className="floating-content">
                      <CardContent className="text-center py-4">
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                        <p className="text-sm text-muted-foreground">Alle vragen zijn beoordeeld</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Overview Tab - All items with status indicators */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* All Tasks */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Alle Opdrachten ({tasks.length})
                  </h3>
                  {tasks.map((task) => (
                    <Card key={task.id} className="floating-content mb-3">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{task.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              Schaal: 0-{task.grading_scale}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(task.created_at), { 
                                addSuffix: true, 
                                locale: nl 
                              })}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {(task.submissions_info?.pending || 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {task.submissions_info?.pending} te beoordelen
                              </Badge>
                            )}
                            {(task.submissions_info?.total || 0) === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Geen inzendingen
                              </Badge>
                            )}
                            {(task.submissions_info?.total || 0) > 0 && (task.submissions_info?.pending || 0) === 0 && (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Volledig beoordeeld
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                          <div className="p-2 bg-blue-50 rounded-md">
                            <div className="text-sm font-semibold text-blue-600">
                              {task.submissions_info?.total || 0}
                            </div>
                            <div className="text-xs text-blue-600">Totaal</div>
                          </div>
                          <div className="p-2 bg-green-50 rounded-md">
                            <div className="text-sm font-semibold text-green-600">
                              {task.submissions_info?.graded || 0}
                            </div>
                            <div className="text-xs text-green-600">Beoordeeld</div>
                          </div>
                          <div className="p-2 bg-orange-50 rounded-md">
                            <div className="text-sm font-semibold text-orange-600">
                              {task.submissions_info?.pending || 0}
                            </div>
                            <div className="text-xs text-orange-600">Wachten</div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewTaskSubmissions(task.id, task.title)}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Bekijk Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {tasks.length === 0 && (
                    <Card className="floating-content">
                      <CardContent className="text-center py-6">
                        <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Nog geen opdrachten voor dit niveau</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* All Questions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Alle Vragen ({questions.length})
                  </h3>
                  {questions.map((question) => (
                    <Card key={question.id} className="floating-content mb-3">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-2">{question.vraag_tekst}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              Type: {question.vraag_type}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(question.created_at), { 
                                addSuffix: true, 
                                locale: nl 
                              })}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {(question.answers_info?.pending || 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {question.answers_info?.pending} te beoordelen
                              </Badge>
                            )}
                            {(question.answers_info?.total || 0) === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Geen antwoorden
                              </Badge>
                            )}
                            {(question.answers_info?.total || 0) > 0 && (question.answers_info?.pending || 0) === 0 && (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Volledig beoordeeld
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                          <div className="p-2 bg-blue-50 rounded-md">
                            <div className="text-sm font-semibold text-blue-600">
                              {question.answers_info?.total || 0}
                            </div>
                            <div className="text-xs text-blue-600">Totaal</div>
                          </div>
                          <div className="p-2 bg-green-50 rounded-md">
                            <div className="text-sm font-semibold text-green-600">
                              {question.answers_info?.graded || 0}
                            </div>
                            <div className="text-xs text-green-600">Beoordeeld</div>
                          </div>
                          <div className="p-2 bg-orange-50 rounded-md">
                            <div className="text-sm font-semibold text-orange-600">
                              {question.answers_info?.pending || 0}
                            </div>
                            <div className="text-xs text-orange-600">Wachten</div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewQuestionAnswers(question.id, question.vraag_tekst)}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Bekijk Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {questions.length === 0 && (
                    <Card className="floating-content">
                      <CardContent className="text-center py-6">
                        <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Nog geen vragen voor dit niveau</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!selectedClass && classes.length === 0 && (
          <Card className="floating-content">
            <CardContent className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Geen klassen beschikbaar</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Submissions Modal */}
      <Dialog open={submissionModal.open} onOpenChange={(open) => setSubmissionModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inzendingen - {submissionModal.taskTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{submission.student?.full_name || 'Onbekend'}</h4>
                    <p className="text-sm text-muted-foreground">
                      Ingediend: {formatDistanceToNow(new Date(submission.submitted_at), { 
                        addSuffix: true, 
                        locale: nl 
                      })}
                    </p>
                  </div>
                  {submission.grade !== null ? (
                    <Badge variant="default">
                      <Star className="w-3 h-3 mr-1" />
                      {submission.grade}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Te beoordelen
                    </Badge>
                  )}
                </div>
                
                {submission.submission_content && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Tekstinzending:</p>
                    <p className="text-sm bg-muted p-2 rounded">{submission.submission_content}</p>
                  </div>
                )}
                
                {submission.submission_file_path && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Bestand:</p>
                    <a 
                      href={submission.submission_file_path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Bekijk bestand
                    </a>
                  </div>
                )}

                {submission.feedback && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Feedback:</p>
                    <p className="text-sm bg-green-50 p-2 rounded">{submission.feedback}</p>
                  </div>
                )}

                {submission.grade === null && (
                  <div className="flex gap-2 pt-3 border-t">
                    <input 
                      type="number" 
                      placeholder="Cijfer" 
                      className="w-20 px-2 py-1 border rounded text-sm"
                      min="0"
                      max="100"
                      id={`grade-${submission.id}`}
                    />
                    <input 
                      type="text" 
                      placeholder="Feedback (optioneel)" 
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      id={`feedback-${submission.id}`}
                    />
                    <Button 
                      size="sm"
                      onClick={() => {
                        const gradeInput = document.getElementById(`grade-${submission.id}`) as HTMLInputElement;
                        const feedbackInput = document.getElementById(`feedback-${submission.id}`) as HTMLInputElement;
                        const grade = parseFloat(gradeInput?.value);
                        const feedback = feedbackInput?.value;
                        
                        if (!isNaN(grade)) {
                          gradeSubmission(submission.id, grade, feedback || undefined);
                        }
                      }}
                    >
                      Beoordeel
                    </Button>
                  </div>
                )}
              </Card>
            ))}
            {submissions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Geen inzendingen gevonden</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Answers Modal */}
      <Dialog open={answerModal.open} onOpenChange={(open) => setAnswerModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Antwoorden - {answerModal.questionText}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {answers.map((answer) => (
              <Card key={answer.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{answer.student?.full_name || 'Onbekend'}</h4>
                    <p className="text-sm text-muted-foreground">
                      Beantwoord: {formatDistanceToNow(new Date(answer.created_at), { 
                        addSuffix: true, 
                        locale: nl 
                      })}
                    </p>
                  </div>
                  {answer.is_correct !== null ? (
                    <Badge variant={answer.is_correct ? "default" : "destructive"}>
                      <Star className="w-3 h-3 mr-1" />
                      {answer.punten || 0} pts
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Te beoordelen
                    </Badge>
                  )}
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Antwoord:</p>
                  <p className="text-sm bg-muted p-2 rounded">{answer.antwoord}</p>
                </div>

                {answer.feedback && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Feedback:</p>
                    <p className="text-sm bg-green-50 p-2 rounded">{answer.feedback}</p>
                  </div>
                )}

                {answer.is_correct === null && (
                  <div className="flex gap-2 pt-3 border-t">
                    <select 
                      className="px-2 py-1 border rounded text-sm"
                      id={`correct-${answer.id}`}
                    >
                      <option value="">Kies...</option>
                      <option value="true">Correct</option>
                      <option value="false">Incorrect</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="Punten" 
                      className="w-20 px-2 py-1 border rounded text-sm"
                      min="0"
                      id={`points-${answer.id}`}
                    />
                    <input 
                      type="text" 
                      placeholder="Feedback (optioneel)" 
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      id={`feedback-${answer.id}`}
                    />
                    <Button 
                      size="sm"
                      onClick={() => {
                        const correctSelect = document.getElementById(`correct-${answer.id}`) as HTMLSelectElement;
                        const pointsInput = document.getElementById(`points-${answer.id}`) as HTMLInputElement;
                        const feedbackInput = document.getElementById(`feedback-${answer.id}`) as HTMLInputElement;
                        
                        const isCorrect = correctSelect?.value === 'true';
                        const points = parseInt(pointsInput?.value) || 0;
                        const feedback = feedbackInput?.value;
                        
                        if (correctSelect?.value) {
                          gradeAnswer(answer.id, isCorrect, points, feedback || undefined);
                        }
                      }}
                    >
                      Beoordeel
                    </Button>
                  </div>
                )}
              </Card>
            ))}
            {answers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Geen antwoorden gevonden</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};