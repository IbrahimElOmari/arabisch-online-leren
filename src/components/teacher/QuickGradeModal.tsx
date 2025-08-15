
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/hooks/useTaskStore';
import { toast } from 'sonner';

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
}

interface QuickGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: TaskSubmission | null;
  gradingScale: number;
}

export const QuickGradeModal = ({ isOpen, onClose, submission, gradingScale }: QuickGradeModalProps) => {
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { gradeSubmission } = useTaskStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;

    const gradeNumber = parseInt(grade);
    if (isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > gradingScale) {
      toast.error(`Cijfer moet tussen 0 en ${gradingScale} zijn`);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await gradeSubmission(submission.id, gradeNumber, feedback);
      if (success) {
        toast.success('Beoordeling opgeslagen');
        onClose();
        setGrade('');
        setFeedback('');
      }
    } catch (error) {
      toast.error('Kon beoordeling niet opslaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Beoordeel Inzending</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Student</Label>
            <p className="text-lg">{submission.student?.full_name || 'Onbekend'}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Inzending</Label>
            <div className="mt-2 p-4 bg-muted rounded-lg">
              {submission.submission_content && (
                <p className="whitespace-pre-wrap">{submission.submission_content}</p>
              )}
              {submission.submission_file_path && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Bestand</Badge>
                  <span className="text-sm">{submission.submission_file_path.split('/').pop()}</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="grade">Cijfer (0-{gradingScale})</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max={gradingScale}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder={`Voer cijfer in (0-${gradingScale})`}
                required
              />
            </div>

            <div>
              <Label htmlFor="feedback">Feedback (optioneel)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Geef feedback aan de student..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuleren
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Bezig...' : 'Beoordeling Opslaan'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
