import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Clock, CheckCircle, Upload, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';


interface Task {
  id: string;
  title: string;
  description: string;
  required_submission_type: 'text' | 'file';
  grading_scale: number;
  created_at: string;
  level_id: string;
  external_link?: string;
  youtube_url?: string;
  submissions?: any[];
  niveaus: {
    naam: string;
    klassen: {
      name: string;
    };
  };
}

interface Question {
  id: string;
  vraag_tekst: string;
  vraag_type: string;
  opties: any;
  created_at: string;
  niveau_id: string;
  niveaus: {
    naam: string;
    klassen: {
      name: string;
    };
  };
}

export const StudentTasksAndQuestions = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
const [submissionTexts, setSubmissionTexts] = useState<{ [key: string]: string }>({});
const [submissionFiles, setSubmissionFiles] = useState<{ [key: string]: File }>({});
const [submittedTaskIds, setSubmittedTaskIds] = useState<Set<string>>(new Set());
const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: Set<string> }>({});
const [openAnswers, setOpenAnswers] = useState<{ [key: string]: string }>({});
const [questionFiles, setQuestionFiles] = useState<{ [key: string]: File | undefined }>({});

  useEffect(() => {
    fetchTasksAndQuestions();
  }, [profile?.id]);

const fetchTasksAndQuestions = async () => {
  if (!profile?.id) return;

  try {
    // Find paid class enrollments for this student
    const { data: enrollments, error: enrollError } = await supabase
      .from('inschrijvingen')
      .select('class_id')
      .eq('student_id', profile.id)
      .eq('payment_status', 'paid');

    if (enrollError) throw enrollError;
    const classIds = (enrollments || []).map((e: any) => e.class_id);

    if (classIds.length === 0) {
      setTasks([]);
      setQuestions([]);
      return;
    }

    // Get levels for these classes
    const { data: levels, error: levelsError } = await supabase
      .from('niveaus')
      .select('id, class_id, naam, klassen:class_id (name)')
      .in('class_id', classIds);

    if (levelsError) throw levelsError;
    const levelIds = (levels || []).map((l: any) => l.id);

    // Fetch tasks for these levels
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('level_id', levelIds)
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;

    // Fetch student's submissions for these tasks
    let submissionsByTask: Record<string, any[]> = {};
    if (tasksData && tasksData.length) {
      const { data: subs, error: subsError } = await supabase
        .from('task_submissions')
        .select('id, task_id, grade, feedback, submitted_at')
        .eq('student_id', profile.id)
        .in('task_id', tasksData.map(t => t.id));
      if (subsError) throw subsError;
      (subs || []).forEach((s: any) => {
        if (!submissionsByTask[s.task_id]) submissionsByTask[s.task_id] = [];
        submissionsByTask[s.task_id].push(s);
      });
    }

    // Enrich tasks with level/class names via levels map
    const levelsMap: Record<string, any> = {};
    (levels || []).forEach((l: any) => { levelsMap[l.id] = l; });
    const tasksEnriched = (tasksData || []).map((t: any) => ({
      ...t,
      submissions: submissionsByTask[t.id] || [],
      niveaus: {
        naam: levelsMap[t.level_id]?.naam || '',
        klassen: { name: levelsMap[t.level_id]?.klassen?.name || '' }
      }
    }));

    // Fetch questions for these levels
    const { data: questionsData, error: questionsError } = await supabase
      .from('vragen')
      .select(`*, niveaus:niveau_id (naam, klassen:class_id (name))`)
      .in('niveau_id', levelIds)
      .order('created_at', { ascending: false });

    if (questionsError) throw questionsError;

    setTasks(tasksEnriched || []);
    setQuestions(questionsData || []);
  } catch (error) {
    console.error('Error fetching tasks and questions:', error);
    toast.error('Fout bij het ophalen van taken en vragen');
  } finally {
    setLoading(false);
  }
};

const submitTask = async (taskId: string) => {
  try {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let submissionContent: string | undefined = undefined;
    let submissionFilePath: string | undefined = undefined;

    if (task.required_submission_type === 'text') {
      submissionContent = (submissionTexts[taskId] || '').trim();
      if (!submissionContent) {
        toast.error('Voer een antwoord in');
        return;
      }
    } else if (task.required_submission_type === 'file' && submissionFiles[taskId]) {
      const file = submissionFiles[taskId];
      // Get signed URL from edge function then upload
      const { data, error } = await supabase.functions.invoke('manage-task', {
        body: { action: 'get-signed-url', fileName: file.name }
      });
      if (error) throw error;
      const { signedUrl, path } = data as { signedUrl: string; path: string };
      const uploadRes = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!uploadRes.ok) throw new Error('Upload mislukt');
      submissionFilePath = path;
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

    toast.success('Opdracht succesvol ingediend!');
    fetchTasksAndQuestions();
    // Clear form
    setSubmissionTexts(prev => ({ ...prev, [taskId]: '' }));
    setSubmissionFiles(prev => { const n = { ...prev }; delete n[taskId]; return n; });
  } catch (error) {
    console.error('Error submitting task:', error);
    toast.error('Fout bij het indienen van de opdracht');
  }
};

const submitAnswer = async (questionId: string, answer: any) => {
  try {
    const payload: any = {
      vraag_id: questionId,
      student_id: profile?.id,
      antwoord: answer
    };

    const { error } = await supabase
      .from('antwoorden')
      .insert(payload);

    if (error) throw error;

    toast.success('Antwoord succesvol ingediend!');
    fetchTasksAndQuestions();
  } catch (error) {
    console.error('Error submitting answer:', error);
    toast.error('Fout bij het indienen van het antwoord');
  }
};

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="main-content-card">
        <h2 className="text-2xl font-bold mb-6">Mijn Taken & Vragen</h2>
        
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">
              Taken ({tasks.filter(t => !t.submissions?.length).length})
            </TabsTrigger>
            <TabsTrigger value="questions">
              Vragen ({questions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            {tasks.filter(task => !task.submissions?.length).map((task) => (
              <Card key={task.id} className="floating-content">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {task.niveaus.klassen.name} - {task.niveaus.naam}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <FileText className="w-3 h-3 mr-1" />
                      {task.required_submission_type === 'text' ? 'Tekst' : 'Bestand'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{task.description}</p>
                  
                  {task.external_link && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={task.external_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Externe link
                      </a>
                    </Button>
                  )}

                  <div className="border-t pt-4">
                    {task.required_submission_type === 'text' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Jouw antwoord:</label>
                        <Textarea
                          placeholder="Typ hier je antwoord..."
                          value={submissionTexts[task.id] || ''}
                          onChange={(e) => setSubmissionTexts(prev => ({
                            ...prev,
                            [task.id]: e.target.value
                          }))}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Upload bestand:</label>
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSubmissionFiles(prev => ({
                                ...prev,
                                [task.id]: file
                              }));
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    <Button 
                      onClick={() => submitTask(task.id)}
                      className="mt-3"
                      disabled={
                        task.required_submission_type === 'text' 
                          ? !submissionTexts[task.id]?.trim()
                          : !submissionFiles[task.id]
                      }
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Indienen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {tasks.filter(t => !t.submissions?.length).length === 0 && (
              <Card className="floating-content">
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">Geen openstaande taken</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
            {questions.map((question) => (
              <Card key={question.id} className="floating-content">
<CardHeader>
  <CardTitle className="text-lg">{question.vraag_tekst}</CardTitle>
  <p className="text-sm text-muted-foreground">
    {question.niveaus.klassen.name} - {question.niveaus.naam}
  </p>
</CardHeader>
                <CardContent>
{(question.vraag_type === 'enkelvoudig' || question.vraag_type === 'meervoudig') && question.opties && (
  <div className="space-y-2">
    {question.opties.map((option: string, index: number) => {
      const selectedSet = selectedOptions[question.id] || new Set<string>();
      const isSelected = selectedSet.has(option);
      return (
        <Button
          key={index}
          variant={isSelected ? 'default' : 'outline'}
          className="w-full justify-start"
          onClick={() => {
            setSelectedOptions(prev => {
              const set = new Set(prev[question.id] || []);
              if (question.vraag_type === 'enkelvoudig') {
                return { ...prev, [question.id]: new Set([option]) };
              } else {
                if (set.has(option)) set.delete(option); else set.add(option);
                return { ...prev, [question.id]: set };
              }
            });
          }}
        >
          {option}
        </Button>
      );
    })}
    <Button
      onClick={() => {
        const ansSet = selectedOptions[question.id] || new Set<string>();
        const answer = question.vraag_type === 'enkelvoudig' ? Array.from(ansSet)[0] : Array.from(ansSet);
        if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
        submitAnswer(question.id, answer);
      }}
    >
      Antwoord indienen
    </Button>
  </div>
)}

{question.vraag_type === 'open' && (
  <div className="space-y-2">
    <Textarea
      placeholder="Typ hier je antwoord..."
      value={openAnswers[question.id] || ''}
      onChange={(e) => setOpenAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
    />
    <Button 
      onClick={() => {
        const val = (openAnswers[question.id] || '').trim();
        if (val) submitAnswer(question.id, val);
      }}
    >
      Antwoord indienen
    </Button>
  </div>
)}

{/* Media support */}
{(question as any).audio_url && (
  <div className="mt-4">
    <audio controls src={(question as any).audio_url} />
  </div>
)}
{(question as any).video_url && (
  <div className="mt-4">
    <a href={(question as any).video_url} target="_blank" rel="noopener noreferrer" className="underline text-primary">
      Bekijk video
    </a>
  </div>
)}
                </CardContent>
              </Card>
            ))}
            
            {questions.length === 0 && (
              <Card className="floating-content">
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Geen vragen beschikbaar</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};