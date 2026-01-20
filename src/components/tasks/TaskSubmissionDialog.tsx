import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Upload, Send, X, FileText } from 'lucide-react';

interface TaskSubmissionDialogProps {
  open: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    required_submission_type: 'text' | 'file';
  };
  onSuccess?: () => void;
}

export const TaskSubmissionDialog = ({ open, onClose, task, onSuccess }: TaskSubmissionDialogProps) => {
  const { t } = useTranslation();
  const { submitTask, getSignedUploadUrl, loading } = useTaskStore();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    try {
      setUploading(true);
      let filePath: string | undefined;

      if (file && task.required_submission_type === 'file') {
        const urlResult = await getSignedUploadUrl(file.name);
        if (!urlResult) throw new Error('Could not get upload URL');
        
        // Upload file
        const uploadResponse = await fetch(urlResult.signedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });
        
        if (!uploadResponse.ok) throw new Error('Upload failed');
        filePath = urlResult.path;
      }

      const success = await submitTask(
        task.id,
        task.required_submission_type === 'text' ? content : undefined,
        filePath
      );

      if (success) {
        toast.success(t('tasks.submittedSuccess', 'Inzending verstuurd!'));
        setContent('');
        setFile(null);
        onSuccess?.();
        onClose();
      } else {
        toast.error(t('tasks.submitError', 'Kon inzending niet versturen'));
      }
    } catch (error: any) {
      toast.error(error.message || t('common.error', 'Er ging iets mis'));
    } finally {
      setUploading(false);
    }
  };

  const isSubmitDisabled = loading || uploading || (task.required_submission_type === 'text' ? !content.trim() : !file);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {task.title}
          </DialogTitle>
          {task.description && (
            <DialogDescription className="text-start">
              {task.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {task.required_submission_type === 'text' ? (
            <div className="space-y-2">
              <Label>{t('tasks.yourAnswer', 'Jouw antwoord')}</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('tasks.typeAnswer', 'Typ je antwoord hier...')}
                className="min-h-[150px]"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t('tasks.uploadFile', 'Upload bestand')}</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {file && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            <X className="h-4 w-4 me-2" />
            {t('common.cancel', 'Annuleren')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitDisabled}
          >
            <Send className="h-4 w-4 me-2" />
            {uploading ? t('common.uploading', 'Uploaden...') : loading ? t('common.sending', 'Versturen...') : t('common.submit', 'Indienen')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
