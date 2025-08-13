
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  required_submission_type: 'text' | 'file';
  grading_scale: number;
}

interface TaskEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSuccess: () => void;
}

export const TaskEditModal = ({ open, onOpenChange, task, onSuccess }: TaskEditModalProps) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [submissionType, setSubmissionType] = useState<'text' | 'file'>(task?.required_submission_type || 'text');
  const [gradingScale, setGradingScale] = useState(task?.grading_scale?.toString() || '10');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setSubmissionType(task.required_submission_type);
      setGradingScale(task.grading_scale?.toString() || '10');
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) {
      toast.error('Titel is verplicht');
      return;
    }

    const gradingScaleNum = parseInt(gradingScale);
    if (isNaN(gradingScaleNum) || gradingScaleNum < 1 || gradingScaleNum > 100) {
      toast.error('Beoordelingsschaal moet tussen 1 en 100 zijn');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          required_submission_type: submissionType,
          grading_scale: gradingScaleNum
        })
        .eq('id', task.id);

      if (error) throw error;

      toast.success('Opdracht bijgewerkt');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Fout bij bijwerken opdracht');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Opdracht Bewerken</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Titel</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Opdracht titel"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Beschrijving</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opdracht beschrijving"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Type Inzending</label>
            <Select value={submissionType} onValueChange={(value: 'text' | 'file') => setSubmissionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Tekst</SelectItem>
                <SelectItem value="file">Bestand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Beoordelingsschaal (max punten)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={gradingScale}
              onChange={(e) => setGradingScale(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
