import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Fout',
        description: 'Voer je e-mailadres in',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      toast({
        title: 'Succes',
        description: 'Er is een e-mail verzonden naar je e-mailadres met instructies om je wachtwoord te resetten',
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het verzenden van de reset-e-mail',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Wachtwoord vergeten
          </DialogTitle>
          <DialogDescription>
            {emailSent 
              ? 'Check je e-mail voor instructies om je wachtwoord te resetten.'
              : 'Voer je e-mailadres in en we sturen je instructies om je wachtwoord te resetten.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mailadres</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="je-email@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Verzenden...' : 'Reset-link verzenden'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end">
            <Button onClick={handleClose}>
              Sluiten
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};