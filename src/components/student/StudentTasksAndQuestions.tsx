import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Radio, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase } from '@/integrations/supabase/client';

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
  niveaus: {
    naam: string;
  };
}

interface Task {
  id: string;
  level_id: string;
  author_id: string;
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

interface StudentTasksAndQuestionsProps {
  levelId: string;
  levelName: string;
}

export const StudentTasksAndQuestions = ({ levelId, levelName }: StudentTasksAndQuestionsProps) => {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchQuestions(levelId);
    fetchTasks(levelId);
  }, [levelId, profile]);

  const fetchQuestions = async (levelId: string) => {
    try {
      const { data, error } = await supabase
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
            naam
          )
        `)
        .eq('niveau_id', levelId)
        .eq('antwoorden.student_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const questionsWithAnswers = data?.map(question => ({
        ...question,
        correct_antwoord: typeof question.correct_antwoord === 'string' 
          ? question.correct_antwoord 
          : JSON.stringify(question.correct_antwoord) || '',
        answer: question.antwoorden?.[0] ? {
          ...question.antwoorden[0],
          antwoord: typeof question.antwoorden[0].antwoord === 'string'
            ? question.antwoorden[0].antwoord
            : JSON.stringify(question.antwoorden[0].antwoord) || ''
        } : undefined
      })) || [];

      setQuestions(questionsWithAnswers);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

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
        author: { full_name: task.profiles?.full_name || 'Onbekend' }
      })) || [];

      setTasks(tasksWithAuthor);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTextTask = async (taskId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .insert([
          {
            task_id: taskId,
            student_id: profile?.id,
            submission_content: submissionText,
          },
        ]);

      if (error) {
        throw new Error(`Taak kon niet worden ingediend: ${error.message}`);
      }

      setTaskSubmissions((prevSubmissions) => [
        ...prevSubmissions,
        {
          id: data[0].id,
          task_id: taskId,
          student_id: profile?.id,
          submission_content: submissionText,
          submitted_at: new Date().toISOString(),
        },
      ]);
      setSubmissionText('');
      alert('Taak succesvol ingediend!');
    } catch (error: any) {
      setError(error.message);
      console.error('Fout bij het indienen van de taak:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file);
  };

  const handleUploadFileTask = async (taskId: string) => {
    setUploading(true);
    setError(null);

    if (!selectedFile) {
      setError('Selecteer eerst een bestand.');
      setUploading(false);
      return;
    }

    try {
      const filePath = `tasks/${profile?.id}/${taskId}/${selectedFile.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('task-submissions')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Bestand kon niet worden geüpload: ${uploadError.message}`);
      }

      const { error: dbError } = await supabase
        .from('task_submissions')
        .insert([
          {
            task_id: taskId,
            student_id: profile?.id,
            submission_file_path: filePath,
          },
        ]);

      if (dbError) {
        throw new Error(`Bestandsinformatie kon niet worden opgeslagen: ${dbError.message}`);
      }

      setTaskSubmissions((prevSubmissions) => [
        ...prevSubmissions,
        {
          id: data.path,
          task_id: taskId,
          student_id: profile?.id,
          submission_file_path: filePath,
          submitted_at: new Date().toISOString(),
        },
      ]);

      setSelectedFile(null);
      alert('Bestand succesvol geüpload en taak ingediend!');
    } catch (error: any) {
      setError(error.message);
      console.error('Fout bij het uploaden van het bestand en indienen van de taak:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Taken voor {levelName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground">Geen taken beschikbaar voor dit niveau.</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="space-y-2 border rounded-md p-4">
                <h3 className="text-lg font-semibold">{task.title}</h3>
                {task.description && <p className="text-muted-foreground">{task.description}</p>}
                <Separator />

                {task.required_submission_type === 'text' && (
                  <>
                    <Textarea
                      placeholder="Typ hier je antwoord..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="w-full resize-none"
                    />
                    <Button onClick={() => handleSubmitTextTask(task.id)} disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Taak Indienen
                    </Button>
                  </>
                )}

                {task.required_submission_type === 'file' && (
                  <>
                    <div className="flex items-center space-x-4">
                      <Input type="file" id="file" onChange={handleFileChange} />
                      {selectedFile && (
                        <Label htmlFor="file">{selectedFile.name}</Label>
                      )}
                    </div>
                    <Button onClick={() => handleUploadFileTask(task.id)} disabled={uploading}>
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Bestand Uploaden en Taak Indienen
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Vragen voor {levelName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <p className="text-muted-foreground">Geen vragen beschikbaar voor dit niveau.</p>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="space-y-2 border rounded-md p-4">
                <h3 className="text-lg font-semibold">{question.vraag}</h3>
                {question.audio_url && (
                  <audio controls className="w-full">
                    <source src={question.audio_url} type="audio/mpeg" />
                    Je browser ondersteunt geen audio element.
                  </audio>
                )}
                <Textarea
                  placeholder="Typ hier je antwoord..."
                  className="w-full resize-none"
                />
                <Button>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Antwoord Indienen
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
