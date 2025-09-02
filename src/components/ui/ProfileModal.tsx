import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Edit, Save, X } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
  });
  const { getFlexDirection, getTextAlign, getMarginEnd } = useRTLLayout();

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone_number: (profile as Tables<'profiles'>).phone_number || '',
      });
    }
  }, [profile]);

  if (!user || !profile) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Profiel succesvol bijgewerkt',
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het bijwerken van je profiel',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name || '',
      phone_number: (profile as Tables<'profiles'>).phone_number || '',
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={`${getFlexDirection()} items-center gap-2 ${getTextAlign('left')}`}>
            <User className="h-5 w-5" />
            Mijn Profiel
          </DialogTitle>
          <DialogDescription className={getTextAlign('left')}>
            Bekijk en bewerk je profielinformatie
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Volledige naam</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Voer je volledige naam in"
                />
              ) : (
                <div className={`p-2 bg-muted rounded-md ${getTextAlign('left')}`}>
                  {profile.full_name || 'Niet ingesteld'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <div className={`p-2 bg-muted rounded-md text-muted-foreground ${getTextAlign('left')}`}>
                {user.email}
              </div>
              <p className={`text-xs text-muted-foreground ${getTextAlign('left')}`}>
                E-mailadres kan niet worden gewijzigd
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <div className="p-2">
                <Badge variant="secondary" className="capitalize">
                  {profile.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Telefoonnummer</Label>
              {isEditing ? (
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Voer je telefoonnummer in"
                />
              ) : (
                <div className={`p-2 bg-muted rounded-md ${getTextAlign('left')}`}>
                  {(profile as Tables<'profiles'>).phone_number || 'Niet ingesteld'}
                </div>
              )}
            </div>

            {(profile as Tables<'profiles'>).parent_email && (
              <div className="space-y-2">
                <Label htmlFor="parent_email">Ouder e-mailadres</Label>
                <div className={`p-2 bg-muted rounded-md text-muted-foreground ${getTextAlign('left')}`}>
                  {(profile as Tables<'profiles'>).parent_email}
                </div>
              </div>
            )}
          </div>

          <div className={`${getFlexDirection('row')} justify-end gap-2`}>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className={getFlexDirection()}
                >
                  <X className={`h-4 w-4 ${getMarginEnd('2')}`} />
                  Annuleren
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className={getFlexDirection()}
                >
                  <Save className={`h-4 w-4 ${getMarginEnd('2')}`} />
                  {isLoading ? 'Bezig...' : 'Opslaan'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className={getFlexDirection()}
              >
                <Edit className={`h-4 w-4 ${getMarginEnd('2')}`} />
                Bewerken
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
