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

  useEffect(() => {
    fetchTasksAndQuestions();
  }, [profile?.id]);

  const fetchTasksAndQuestions = async () => {
    if (!profile?.id) return;

    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          niveaus:level_id (
            naam,
            klassen:class_id (name)
          ),
          task_submissions!left (
            id,
            grade,
            feedback,
            submitted_at
          )
        `)
        .eq('task_submissions.student_id', profile.id);

      if (tasksError) throw tasksError;

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('vragen')
        .select(`
          *,
          niveaus:niveau_id (
            naam,
            klassen:class_id (name)
          )
        `);

      if (questionsError) throw questionsError;

      setTasks(tasksData || []);
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
      const submissionData: any = {
        task_id: taskId,
        student_id: profile?.id,
      };

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      if (task.required_submission_type === 'text') {
        submissionData.submission_content = submissionTexts[taskId];
      } else if (task.required_submission_type === 'file' && submissionFiles[taskId]) {
        // Upload file first
        const file = submissionFiles[taskId];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `submissions/${profile?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        submissionData.submission_file_path = filePath;
      }

      const { error } = await supabase
        .from('task_submissions')
        .insert(submissionData);

      if (error) throw error;

      toast.success('Opdracht succesvol ingediend!');
      fetchTasksAndQuestions();
      
      // Clear form
      setSubmissionTexts(prev => ({ ...prev, [taskId]: '' }));
      delete submissionFiles[taskId];
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Fout bij het indienen van de opdracht');
    }
  };

  const submitAnswer = async (questionId: string, answer: any) => {
    try {
      const { error } = await supabase
        .from('antwoorden')
        .insert({
          vraag_id: questionId,
          student_id: profile?.id,
          antwoord: answer
        });

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
                  {question.vraag_type === 'multiple_choice' && question.opties && (
                    <div className="space-y-2">
                      {question.opties.map((option: string, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => submitAnswer(question.id, option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {question.vraag_type === 'open' && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Typ hier je antwoord..."
                        id={`answer-${question.id}`}
                      />
                      <Button 
                        onClick={() => {
                          const textarea = document.getElementById(`answer-${question.id}`) as HTMLTextAreaElement;
                          if (textarea?.value.trim()) {
                            submitAnswer(question.id, textarea.value);
                          }
                        }}
                      >
                        Antwoord indienen
                      </Button>
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