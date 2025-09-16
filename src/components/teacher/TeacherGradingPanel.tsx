import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  User, 
  Calendar, 
  Star,
  MessageCircle,
  Download,
  Gift
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useNotifications } from '@/hooks/useNotifications';
import { BonusPointsModal } from '@/components/teacher/BonusPointsModal';

interface TaskSubmission {
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
  task?: {
    title: string;
    grading_scale: number;
  };
}

interface QuestionAnswer {
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
  question?: {
    vraag_tekst: string;
    correct_antwoord: string;
  };
}

interface TeacherGradingPanelProps {
  classId: string;
  levelId?: string;
}

export const TeacherGradingPanel = ({ classId, levelId }: TeacherGradingPanelProps) => {
  const { gradeSubmission } = useTaskStore();
  const { createNotification } = useNotifications();
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingMode, setGradingMode] = useState<'tasks' | 'questions'>('tasks');
  const [bonusPointsModal, setBonusPointsModal] = useState<{
    isOpen: boolean;
    student?: { id: string; full_name: string };
    niveau?: { id: string; naam: string };
  }>({ isOpen: false });

  useEffect(() => {
    loadSubmissions();
  }, [classId, levelId]);

  const loadSubmissions = async () => {
    setLoading(true);
    await Promise.all([
      fetchTaskSubmissions(),
      fetchQuestionAnswers()
    ]);
    setLoading(false);
  };

  const fetchTaskSubmissions = async () => {
    try {
      let query = supabase
        .from('task_submissions')
        .select(`
          *,
          profiles!task_submissions_student_id_fkey(full_name),
          tasks!inner(
            title,
            grading_scale,
            level_id,
            niveaus!inner(
              class_id
            )
          )
        `)
        .eq('tasks.niveaus.class_id', classId)
        .order('submitted_at', { ascending: false });

      if (levelId) {
        query = query.eq('tasks.level_id', levelId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedSubmissions = data?.map(sub => ({
        ...sub,
        student: { full_name: sub.profiles?.full_name || 'Onbekend' },
        task: {
          title: sub.tasks?.title || 'Onbekende taak',
          grading_scale: sub.tasks?.grading_scale || 10
        }
      })) || [];

      setTaskSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('Error fetching task submissions:', error);
    }
  };

  const fetchQuestionAnswers = async () => {
    try {
      let query = supabase
        .from('antwoorden')
        .select(`
          *,
          profiles!antwoorden_student_id_fkey(full_name),
          vragen!inner(
            vraag_tekst,
            correct_antwoord,
            niveau_id,
            niveaus!inner(
              class_id
            )
          )
        `)
        .eq('vragen.niveaus.class_id', classId)
        .order('created_at', { ascending: false });

      if (levelId) {
        query = query.eq('vragen.niveau_id', levelId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedAnswers = data?.map(answer => ({
        ...answer,
        student: { full_name: answer.profiles?.full_name || 'Onbekend' },
        question: {
          vraag_tekst: answer.vragen?.vraag_tekst || 'Onbekende vraag',
          correct_antwoord: typeof answer.vragen?.correct_antwoord === 'string' 
            ? answer.vragen.correct_antwoord 
            : JSON.stringify(answer.vragen?.correct_antwoord) || ''
        },
        antwoord: typeof answer.antwoord === 'string' 
          ? answer.antwoord 
          : JSON.stringify(answer.antwoord) || ''
      })) || [];

      setQuestionAnswers(formattedAnswers);
    } catch (error) {
      console.error('Error fetching question answers:', error);
    }
  };

  const handleGradeTask = async (submissionId: string, grade: number, feedback: string) => {
    const success = await gradeSubmission(submissionId, grade, feedback);
    if (success) {
      const submission = taskSubmissions.find(s => s.id === submissionId);
      if (submission) {
        await createNotification(
          submission.student_id, 
          `Je taak "${submission.task?.title}" is beoordeeld met cijfer ${grade}`
        );
      }
      await fetchTaskSubmissions();
    }
  };

  const handleGradeQuestion = async (answerId: string, isCorrect: boolean, points: number, feedback: string) => {
    try {
      const { error } = await supabase
        .from('antwoorden')
        .update({
          is_correct: isCorrect,
          punten: points,
          feedback: feedback
        })
        .eq('id', answerId);

      if (error) throw error;
      
      const answer = questionAnswers.find(a => a.id === answerId);
      if (answer) {
        await createNotification(
          answer.student_id,
          `Je antwoord op een vraag is beoordeeld met ${points} punten`
        );
      }
      
      await fetchQuestionAnswers();
    } catch (error) {
      console.error('Error grading question:', error);
    }
  };

  const TaskSubmissionCard = ({ submission }: { submission: TaskSubmission }) => {
    const [grade, setGrade] = useState(submission.grade?.toString() || '');
    const [feedback, setFeedback] = useState(submission.feedback || '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      setSubmitting(true);
      await handleGradeTask(submission.id, parseFloat(grade), feedback);
      setSubmitting(false);
    };

    const getStatusBadge = () => {
      if (submission.grade !== null && submission.grade !== undefined) {
        return (
          <Badge variant="default">
            Beoordeeld: {submission.grade}/{submission.task?.grading_scale}
          </Badge>
        );
      }
      return <Badge variant="outline">Wacht op beoordeling</Badge>;
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{submission.task?.title}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {submission.student?.full_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(submission.submitted_at).toLocaleString('nl-NL')}
                </span>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Inzending van student</h4>
            {submission.submission_content && (
              <p className="text-sm">{submission.submission_content}</p>
            )}
            {submission.submission_file_path && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Bestand ingeleverd</span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`grade-${submission.id}`}>
                Cijfer (0-{submission.task?.grading_scale})
              </Label>
              <Input
                id={`grade-${submission.id}`}
                type="number"
                min="0"
                max={submission.task?.grading_scale}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Voer cijfer in"
              />
            </div>
            <div>
              <Label htmlFor={`feedback-${submission.id}`}>Feedback</Label>
              <Textarea
                id={`feedback-${submission.id}`}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optionele feedback voor de student"
                className="min-h-[80px]"
              />
            </div>
          </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSubmit}
                disabled={!grade || submitting}
                className="flex-1"
              >
                <Star className="h-4 w-4 mr-2" />
                {submitting ? 'Bezig met beoordelen...' : 'Beoordeling Opslaan'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setBonusPointsModal({
                  isOpen: true,
                  student: { id: submission.student_id, full_name: submission.student?.full_name || 'Onbekend' },
                  niveau: { id: levelId || '', naam: 'Niveau' }
                })}
                disabled={submitting}
              >
                <Gift className="h-4 w-4 mr-1" />
                Bonus
              </Button>
            </div>
        </CardContent>
      </Card>
    );
  };

  const QuestionAnswerCard = ({ answer }: { answer: QuestionAnswer }) => {
    const [isCorrect, setIsCorrect] = useState(answer.is_correct ?? false);
    const [points, setPoints] = useState(answer.punten?.toString() || '');
    const [feedback, setFeedback] = useState(answer.feedback || '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      setSubmitting(true);
      await handleGradeQuestion(answer.id, isCorrect, parseFloat(points), feedback);
      setSubmitting(false);
    };

    const getStatusBadge = () => {
      if (answer.punten !== null && answer.punten !== undefined) {
        return (
          <Badge variant={answer.is_correct ? "default" : "destructive"}>
            {answer.is_correct ? 'Correct' : 'Incorrect'} - {answer.punten} punten
          </Badge>
        );
      }
      return <Badge variant="outline">Wacht op beoordeling</Badge>;
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Vraag Antwoord</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {answer.student?.full_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(answer.created_at).toLocaleString('nl-NL')}
                </span>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Vraag</h4>
            <p className="text-sm">{answer.question?.vraag_tekst}</p>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Antwoord van student</h4>
            <p className="text-sm">{answer.antwoord}</p>
          </div>

          {answer.question?.correct_antwoord && (
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Correct antwoord</h4>
              <p className="text-sm">{answer.question.correct_antwoord}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Correct?</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={isCorrect ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsCorrect(true)}
                >
                  Correct
                </Button>
                <Button
                  variant={!isCorrect ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setIsCorrect(false)}
                >
                  Incorrect
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor={`points-${answer.id}`}>Punten</Label>
              <Input
                id={`points-${answer.id}`}
                type="number"
                min="0"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Punten"
              />
            </div>
            <div>
              <Label htmlFor={`feedback-${answer.id}`}>Feedback</Label>
              <Textarea
                id={`feedback-${answer.id}`}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optionele feedback"
                className="min-h-[60px]"
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!points || submitting}
            className="w-full"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {submitting ? 'Bezig met beoordelen...' : 'Beoordeling Opslaan'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ungraded = {
    tasks: taskSubmissions.filter(s => s.grade === null || s.grade === undefined).length,
    questions: questionAnswers.filter(q => q.punten === null || q.punten === undefined).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Beoordeling & Feedback</h3>
        <div className="flex gap-2">
          <Button
            variant={gradingMode === 'tasks' ? 'default' : 'outline'}
            onClick={() => setGradingMode('tasks')}
            size="sm"
            className="relative"
          >
            Taken ({taskSubmissions.length})
            {ungraded.tasks > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {ungraded.tasks}
              </Badge>
            )}
          </Button>
          <Button
            variant={gradingMode === 'questions' ? 'default' : 'outline'}
            onClick={() => setGradingMode('questions')}
            size="sm"
            className="relative"
          >
            Vragen ({questionAnswers.length})
            {ungraded.questions > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {ungraded.questions}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {gradingMode === 'tasks' ? (
        <div>
          {taskSubmissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Geen taak inzendingen om te beoordelen.</p>
              </CardContent>
            </Card>
          ) : (
            taskSubmissions.map((submission) => (
              <TaskSubmissionCard key={submission.id} submission={submission} />
            ))
          )}
        </div>
      ) : (
        <div>
          {questionAnswers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Geen vraag antwoorden om te beoordelen.</p>
              </CardContent>
            </Card>
          ) : (
            questionAnswers.map((answer) => (
              <QuestionAnswerCard key={answer.id} answer={answer} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
