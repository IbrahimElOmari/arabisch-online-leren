
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Clock, 
  Upload, 
  FileText, 
  Star,
  MessageCircle
} from 'lucide-react';
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

interface StudentTaskSubmissionCardProps {
  task: Task;
  submission?: TaskSubmission;
  onSubmit: (taskId: string, content?: string, filePath?: string) => Promise<void>;
}

export const StudentTaskSubmissionCard = ({ 
  task, 
  submission, 
  onSubmit 
}: StudentTaskSubmissionCardProps) => {
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { getSignedUploadUrl } = useTaskStore();

  const handleTextSubmission = async () => {
    if (!submissionText.trim()) return;
    await onSubmit(task.id, submissionText);
    setSubmissionText('');
  };

  const handleFileSubmission = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      const uploadResult = await getSignedUploadUrl(selectedFile.name);
      if (uploadResult) {
        // Upload file to signed URL
        const uploadResponse = await fetch(uploadResult.signedUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type,
          },
        });

        if (uploadResponse.ok) {
          await onSubmit(task.id, undefined, uploadResult.path);
          setSelectedFile(null);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = () => {
    if (!submission) {
      return <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Nog niet ingeleverd
      </Badge>;
    }
    
    if (submission.grade !== null && submission.grade !== undefined) {
      return <Badge variant="default" className="flex items-center gap-1">
        <Star className="h-3 w-3" />
        Beoordeeld: {submission.grade}/{task.grading_scale}
      </Badge>;
    }
    
    return <Badge variant="secondary" className="flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Ingeleverd
    </Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{task.title}</CardTitle>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Door: {task.author?.full_name || 'Onbekend'} • 
              Punten: {task.grading_scale} • 
              Type: {task.required_submission_type === 'text' ? 'Tekst' : 'Bestand'}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {submission ? (
          <div className="space-y-3">
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Jouw Inzending
              </h4>
              {submission.submission_content && (
                <p className="text-sm">{submission.submission_content}</p>
              )}
              {submission.submission_file_path && (
                <p className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Bestand ingeleverd
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Ingeleverd op: {new Date(submission.submitted_at).toLocaleString('nl-NL')}
              </p>
            </div>

            {submission.feedback && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Feedback van je leerkracht
                </h4>
                <p className="text-sm">{submission.feedback}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Separator />
            
            {task.required_submission_type === 'text' ? (
              <div className="space-y-3">
                <Label htmlFor="submission-text">Jouw antwoord</Label>
                <Textarea
                  id="submission-text"
                  placeholder="Typ hier je antwoord..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleTextSubmission}
                  disabled={!submissionText.trim()}
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Antwoord Indienen
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="submission-file">Selecteer bestand</Label>
                <Input
                  id="submission-file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Geselecteerd: {selectedFile.name}
                  </p>
                )}
                <Button 
                  onClick={handleFileSubmission}
                  disabled={!selectedFile || uploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Bestand Indienen'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
