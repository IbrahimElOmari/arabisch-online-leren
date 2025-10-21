import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BonusPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    full_name: string;
  };
  niveau: {
    id: string;
    naam: string;
  };
  onSuccess: () => void;
}

export const BonusPointsModal = ({ 
  isOpen, 
  onClose, 
  student, 
  niveau, 
  onSuccess 
}: BonusPointsModalProps) => {
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    const pointsNum = parseInt(points);
    if (!pointsNum || pointsNum < 1 || pointsNum > 100) {
      toast({
        title: "Ongeldige punten",
        description: "Punten moeten tussen 1 en 100 zijn",
        variant: "destructive"
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reden vereist",
        description: "Voer een reden in voor de bonuspunten",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Award bonus points
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not authenticated');
      
      const { error: bonusError } = await supabase
        .from('bonus_points')
        .insert({
          student_id: student.id,
          niveau_id: niveau.id,
          awarded_by: userId,
          points: pointsNum,
          reason: reason.trim()
        });

      if (bonusError) throw bonusError;

      // Create notification
      await supabase
        .from('user_notifications')
        .insert({
          user_id: student.id,
          message: `🎁 Je hebt ${pointsNum} bonuspunten gekregen voor ${niveau.naam}! Reden: ${reason.trim()}`
        });

      toast({
        title: "Bonuspunten toegekend!",
        description: `${pointsNum} punten toegekend aan ${student.full_name}`,
      });

      onSuccess();
      onClose();
      setPoints('');
      setReason('');
    } catch (error) {
      console.error('Error awarding bonus points:', error);
      toast({
        title: "Fout bij toekennen punten",
        description: "Er ging iets mis bij het toekennen van bonuspunten",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-500" />
            Bonuspunten Toekennen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Student</div>
            <div className="font-medium">{student.full_name}</div>
            <div className="text-sm text-muted-foreground">Niveau</div>
            <div className="font-medium">{niveau.naam}</div>
          </div>

          <div>
            <Label htmlFor="points">Aantal Punten (1-100)</Label>
            <Input
              id="points"
              type="number"
              min="1"
              max="100"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Bijv. 25"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Maximum 100 bonuspunten per niveau
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reden voor Bonuspunten</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bijv. Uitstekende inzet tijdens de les, creatief antwoord, extra oefening gedaan..."
              className="min-h-[80px]"
            />
          </div>

          {points && parseInt(points) > 0 && parseInt(points) <= 100 && (
            <div className="bg-success/10 border border-success/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-success">
                  {student.full_name} krijgt {points} bonuspunten!
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Annuleren
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !points || !reason.trim()}
          >
            {submitting ? 'Toekennen...' : 'Punten Toekennen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};