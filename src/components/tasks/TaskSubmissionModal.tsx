import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Upload, 
  FileText, 
  Mic, 
  Video, 
  Send,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  required_submission_type: string;
  grading_scale: number;
  external_link?: string;
  youtube_url?: string;
  media_url?: string;
  created_at: string;
}

interface TaskSubmission {
  id: string;
  submission_content?: string;
  submission_file_path?: string;
  grade?: number;
  feedback?: string;
  submitted_at: string;
}

interface TaskSubmissionModalProps {
  task: Task;
  trigger: React.ReactNode;
}

export const TaskSubmissionModal: React.FC<TaskSubmissionModalProps> = ({ task, trigger }) => {
  const [open, setOpen] = useState(false);
  const [submission, setSubmission] = useState<TaskSubmission | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSubmission, setLoadingSubmission] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchExistingSubmission();
    }
  }, [open, task.id]);

  const fetchExistingSubmission = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('task_id', task.id)
        .eq('student_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubmission(data);
      if (data?.submission_content) {
        setSubmissionContent(data.submission_content);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast({
        title: "Fout",
        description: "Kon inzending niet laden",
        variant: "destructive"
      });
    } finally {
      setLoadingSubmission(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}_${task.id}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(`submissions/${fileName}`, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      let filePath: string | undefined;

      // Upload file if provided
      if (file) {
        filePath = await uploadFile(file);
      }

      // Validate submission based on required type
      if (task.required_submission_type === 'text' && !submissionContent.trim()) {
        throw new Error('Tekstinzending is verplicht');
      }

      if (task.required_submission_type === 'file' && !file && !submission?.submission_file_path) {
        throw new Error('Bestandsinzending is verplicht');
      }

      const submissionData = {
        task_id: task.id,
        student_id: user.id,
        submission_content: submissionContent.trim() || null,
        submission_file_path: filePath || submission?.submission_file_path || null
      };

      let result;
      if (submission) {
        // Update existing submission
        result = await supabase
          .from('task_submissions')
          .update(submissionData)
          .eq('id', submission.id)
          .select()
          .single();
      } else {
        // Create new submission
        result = await supabase
          .from('task_submissions')
          .insert(submissionData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "Succes",
        description: submission ? "Inzending bijgewerkt" : "Inzending verzonden"
      });

      setSubmission(result.data);
      setFile(null);
      setOpen(false);
    } catch (error: any) {
      console.error('Error submitting task:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon inzending niet verzenden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSubmissionType = () => {
    switch (task.required_submission_type) {
      case 'text':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Tekst Inzending</label>
            <Textarea
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              placeholder="Schrijf je antwoord hier..."
              rows={6}
              required
            />
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Bestand Uploaden</label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            {submission?.submission_file_path && !file && (
              <div className="text-sm text-muted-foreground">
                Bestaand bestand: {submission.submission_file_path.split('/').pop()}
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Audio Opname</label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".mp3,.wav,.ogg,.m4a"
            />
            <div className="text-sm text-muted-foreground">
              Ondersteunde formaten: MP3, WAV, OGG, M4A
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Video Opname</label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".mp4,.webm,.mov,.avi"
            />
            <div className="text-sm text-muted-foreground">
              Ondersteunde formaten: MP4, WebM, MOV, AVI
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tekst Antwoord (optioneel)</label>
              <Textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Schrijf je antwoord hier..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bestand Uploaden (optioneel)</label>
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.mp3,.wav,.mp4,.webm"
              />
            </div>
          </div>
        );
    }
  };

  const getSubmissionIcon = () => {
    switch (task.required_submission_type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'file':
        return <Upload className="h-4 w-4" />;
      case 'audio':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  const getSubmissionStatus = () => {
    if (!submission) {
      return <Badge variant="outline">Niet ingeleverd</Badge>;
    }
    
    if (submission.grade !== null && submission.grade !== undefined) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Beoordeeld ({submission.grade}/{task.grading_scale})
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Ingeleverd
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSubmissionIcon()}
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getSubmissionStatus()}
                </div>
                
                <div>
                  <span className="text-sm font-medium">Beschrijving:</span>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span><strong>Type:</strong> {task.required_submission_type}</span>
                  <span><strong>Punten:</strong> {task.grading_scale}</span>
                </div>

                {task.external_link && (
                  <div>
                    <span className="text-sm font-medium">Externe link:</span>
                    <a 
                      href={task.external_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline ml-2"
                    >
                      {task.external_link}
                    </a>
                  </div>
                )}

                {task.youtube_url && (
                  <div>
                    <span className="text-sm font-medium">Video:</span>
                    <a 
                      href={task.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline ml-2"
                    >
                      Bekijk video
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Existing Submission */}
          {submission && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-3">Je Inzending</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Ingeleverd op:</strong> {new Date(submission.submitted_at).toLocaleString('nl-NL')}
                  </div>
                  
                  {submission.submission_content && (
                    <div>
                      <strong>Tekst:</strong>
                      <p className="text-sm bg-muted p-2 rounded mt-1">{submission.submission_content}</p>
                    </div>
                  )}
                  
                  {submission.submission_file_path && (
                    <div>
                      <strong>Bestand:</strong>
                      <a 
                        href={submission.submission_file_path} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline ml-2"
                      >
                        {submission.submission_file_path.split('/').pop()}
                      </a>
                    </div>
                  )}

                  {submission.feedback && (
                    <div>
                      <strong>Feedback:</strong>
                      <p className="text-sm bg-green-50 border border-green-200 p-2 rounded mt-1">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Form */}
          {loadingSubmission ? (
            <div className="text-center py-4">Laden...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderSubmissionType()}
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Verzenden...' : (submission ? 'Bijwerken' : 'Inleveren')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Sluiten
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
