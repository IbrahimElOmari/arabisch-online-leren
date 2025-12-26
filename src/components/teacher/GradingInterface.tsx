import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, Download, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TaskSubmission {
  id: string;
  task_id: string;
  student_id: string;
  submission_content?: string;
  submission_file_path?: string;
  grade?: number;
  feedback?: string;
  submitted_at: string;
  tasks: {
    title: string;
    grading_scale: number;
    niveaus: {
      naam: string;
      klassen: {
        name: string;
      };
    };
  };
  profiles: {
    full_name: string;
  };
}

interface StudentAnswer {
  id: string;
  student_id: string;
  vraag_id: string;
  antwoord: any;
  is_correct?: boolean;
  punten?: number;
  feedback?: string;
  created_at: string;
  vragen: {
    vraag_tekst: string;
    correct_antwoord: any;
    niveaus: {
      naam: string;
      klassen: {
        name: string;
      };
    };
  };
  profiles: {
    full_name: string;
  };
}

export const GradingInterface = () => {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<{ [key: string]: number }>({});
  const [feedbacks, setFeedbacks] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSubmissionsAndAnswers();
  }, [profile?.id]);

  const fetchSubmissionsAndAnswers = async () => {
    if (!profile?.id) return;

    try {
      // Fetch task submissions for teacher's classes
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select(`
          *,
          tasks:task_id (
            title,
            grading_scale,
            niveaus:level_id (
              naam,
              klassen:class_id (
                name,
                teacher_id
              )
            )
          ),
          profiles:student_id (full_name)
        `)
        .eq('tasks.niveaus.klassen.teacher_id', profile.id)
        .is('grade', null);

      if (submissionsError) throw submissionsError;

      // Fetch student answers for teacher's questions  
      const { data: answersData, error: answersError } = await supabase
        .from('antwoorden')
        .select(`
          *,
          vragen:vraag_id (
            vraag_tekst,
            correct_antwoord,
            niveaus:niveau_id (
              naam,
              klassen:class_id (
                name,
                teacher_id
              )
            )
          )
        `)
        .eq('vragen.niveaus.klassen.teacher_id', profile.id)
        .is('is_correct', null);

      if (answersError) throw answersError;

      // Fetch student profiles separately to avoid join issues
      const studentIds = answersData?.map(a => a.student_id) || [];
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      if (studentsError) throw studentsError;

      // Combine the data
      const answersWithProfiles = answersData?.map(answer => ({
        ...answer,
        profiles: studentsData?.find(s => s.id === answer.student_id) || { full_name: 'Onbekend' }
      })) || [];

      const mappedSubmissions = submissionsData?.map(sub => ({
        ...sub,
        submission_content: sub.submission_content ?? undefined,
        submission_file_path: sub.submission_file_path ?? undefined,
        feedback: sub.feedback ?? undefined,
        grade: sub.grade ?? undefined
      })) || [];

      setSubmissions(mappedSubmissions);
      setAnswers(answersWithProfiles as StudentAnswer[]);
    } catch (error) {
      console.error('Error fetching submissions and answers:', error);
      toast.error('Fout bij het ophalen van inzendingen');
    } finally {
      setLoading(false);
    }
  };

  const gradeSubmission = async (submissionId: string) => {
    try {
      const grade = grades[submissionId];
      const feedback = feedbacks[submissionId];

      if (grade === undefined) {
        toast.error('Voer een cijfer in');
        return;
      }

      const { error } = await supabase
        .from('task_submissions')
        .update({ grade, feedback })
        .eq('id', submissionId);

      if (error) throw error;

      // Create notification for student
      const submission = submissions.find(s => s.id === submissionId);
      if (submission) {
        await supabase
          .from('user_notifications')
          .insert({
            user_id: submission.student_id,
            message: `Je opdracht "${submission.tasks.title}" is beoordeeld met cijfer ${grade}${feedback ? '. ' + feedback : '.'}`
          });
      }

      toast.success('Beoordeling opgeslagen!');
      fetchSubmissionsAndAnswers();
      
      // Clear form
      setGrades(prev => ({ ...prev, [submissionId]: 0 }));
      setFeedbacks(prev => ({ ...prev, [submissionId]: '' }));
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Fout bij het opslaan van de beoordeling');
    }
  };

  const gradeAnswer = async (answerId: string, isCorrect: boolean, points?: number) => {
    try {
      const feedback = feedbacks[answerId];

      const { error } = await supabase
        .from('antwoorden')
        .update({ 
          is_correct: isCorrect, 
          punten: points,
          feedback,
          beoordeeld_door: profile?.id
        })
        .eq('id', answerId);

      if (error) throw error;

      // Create notification for student
      const answer = answers.find(a => a.id === answerId);
      if (answer) {
        await supabase
          .from('user_notifications')
          .insert({
            user_id: answer.student_id,
            message: `Je antwoord op "${answer.vragen.vraag_tekst}" is beoordeeld als ${isCorrect ? 'juist' : 'onjuist'}${points ? ` (${points} punten)` : ''}${feedback ? '. ' + feedback : '.'}`
          });
      }

      toast.success('Antwoord beoordeeld!');
      fetchSubmissionsAndAnswers();
      
      // Clear feedback
      setFeedbacks(prev => ({ ...prev, [answerId]: '' }));
    } catch (error) {
      console.error('Error grading answer:', error);
      toast.error('Fout bij het beoordelen van het antwoord');
    }
  };

  const downloadFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Fout bij het downloaden van het bestand');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-full min-w-0">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">Inzendingen Beoordelen</h2>
        
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">
              Opdrachten ({submissions.length})
            </TabsTrigger>
            <TabsTrigger value="questions">
              Vragen ({answers.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="floating-content">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{submission.tasks.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {submission.profiles.full_name} • {submission.tasks.niveaus.klassen.name} - {submission.tasks.niveaus.naam}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ingediend {formatDistanceToNow(new Date(submission.submitted_at), { 
                          addSuffix: true, 
                          locale: nl 
                        })}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 me-1" />
                      Te beoordelen
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submission.submission_content && (
                    <div>
                      <label className="text-sm font-medium">Ingediende tekst:</label>
                      <div className="mt-1 p-3 bg-muted rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{submission.submission_content}</p>
                      </div>
                    </div>
                  )}
                  
                  {submission.submission_file_path && (
                    <div>
                      <label className="text-sm font-medium">Ingediend bestand:</label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-1"
                        onClick={() => downloadFile(submission.submission_file_path!)}
                      >
                        <Download className="w-4 h-4 me-2" />
                        Download bestand
                      </Button>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          Cijfer (0-{submission.tasks.grading_scale}):
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max={submission.tasks.grading_scale}
                          value={grades[submission.id] || ''}
                          onChange={(e) => setGrades(prev => ({
                            ...prev,
                            [submission.id]: parseFloat(e.target.value)
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Feedback (optioneel):</label>
                        <Textarea
                          placeholder="Voeg feedback toe..."
                          value={feedbacks[submission.id] || ''}
                          onChange={(e) => setFeedbacks(prev => ({
                            ...prev,
                            [submission.id]: e.target.value
                          }))}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => gradeSubmission(submission.id)}
                      className="mt-3"
                      disabled={grades[submission.id] === undefined}
                    >
                      <Star className="w-4 h-4 me-2" />
                      Beoordeling Opslaan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {submissions.length === 0 && (
              <Card className="floating-content">
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">Geen openstaande opdrachten om te beoordelen</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
            {answers.map((answer) => (
              <Card key={answer.id} className="floating-content">
                <CardHeader>
                  <CardTitle className="text-lg">{answer.vragen.vraag_tekst}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {answer.profiles.full_name} • {answer.vragen.niveaus.klassen.name} - {answer.vragen.niveaus.naam}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Beantwoord {formatDistanceToNow(new Date(answer.created_at), { 
                      addSuffix: true, 
                      locale: nl 
                    })}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Student antwoord:</label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <p className="text-sm">{JSON.stringify(answer.antwoord)}</p>
                    </div>
                  </div>
                  
                  {answer.vragen.correct_antwoord && (
                    <div>
                      <label className="text-sm font-medium">Correct antwoord:</label>
                      <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">{JSON.stringify(answer.vragen.correct_antwoord)}</p>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Feedback (optioneel):</label>
                        <Textarea
                          placeholder="Voeg feedback toe..."
                          value={feedbacks[answer.id] || ''}
                          onChange={(e) => setFeedbacks(prev => ({
                            ...prev,
                            [answer.id]: e.target.value
                          }))}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => gradeAnswer(answer.id, true, 1)}
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 me-2" />
                          Juist
                        </Button>
                        <Button 
                          onClick={() => gradeAnswer(answer.id, false, 0)}
                          variant="destructive"
                        >
                          Onjuist
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {answers.length === 0 && (
              <Card className="floating-content">
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">Geen openstaande antwoorden om te beoordelen</p>
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
