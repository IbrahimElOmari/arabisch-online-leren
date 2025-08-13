
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Question {
  id: string;
  vraag_tekst: string;
  vraag_type: string;
}

interface QuestionEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  onSuccess: () => void;
}

export const QuestionEditModal = ({ open, onOpenChange, question, onSuccess }: QuestionEditModalProps) => {
  const [questionText, setQuestionText] = useState(question?.vraag_tekst || '');
  const [questionType, setQuestionType] = useState(question?.vraag_type || 'open');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (question) {
      setQuestionText(question.vraag_tekst);
      setQuestionType(question.vraag_type);
    }
  }, [question]);

  const handleSave = async () => {
    if (!question || !questionText.trim()) {
      toast.error('Vraag tekst is verplicht');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vragen')
        .update({
          vraag_tekst: questionText.trim(),
          vraag_type: questionType
        })
        .eq('id', question.id);

      if (error) throw error;

      toast.success('Vraag bijgewerkt');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Fout bij bijwerken vraag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vraag Bewerken</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Vraag</label>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Voer je vraag in"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={questionType} onValueChange={setQuestionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open vraag</SelectItem>
                <SelectItem value="multiple_choice">Meerkeuzevraag</SelectItem>
                <SelectItem value="upload">Bestand upload</SelectItem>
                <SelectItem value="audio">Audio opname</SelectItem>
                <SelectItem value="video">Video opname</SelectItem>
              </SelectContent>
            </Select>
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
