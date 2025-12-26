import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useUserRole } from '@/hooks/useUserRole';
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
import { useTranslation } from '@/contexts/TranslationContext';
import { useRTLAnimations } from '@/hooks/useRTLAnimations';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, profile } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
  });
  const { getFlexDirection, getTextAlign, getMarginEnd, isRTL } = useRTLLayout();
  const { t } = useTranslation();
  const { getModalSlideClasses } = useRTLAnimations();

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
        title: t('common.success'),
        description: t('user.profile_updated', 'Profiel succesvol bijgewerkt'),
      });

      setIsEditing(false);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error updating profile:', error);
      toast({
        title: t('common.error'),
        description: t('error.profile_update_failed', 'Er is een fout opgetreden bij het bijwerken van je profiel'),
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
      <DialogContent className={`sm:max-w-md ${getModalSlideClasses()}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className={`${getFlexDirection()} items-center gap-2 ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
            <User className="h-5 w-5" />
            {t('user.profile', 'Mijn Profiel')}
          </DialogTitle>
          <DialogDescription className={`${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
            {t('user.profile_description', 'Bekijk en bewerk je profielinformatie')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className={isRTL ? 'arabic-text' : ''}>
                {t('user.full_name', 'Volledige naam')}
              </Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder={t('user.full_name_placeholder', 'Voer je volledige naam in')}
                  className={isRTL ? 'text-right arabic-text' : ''}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              ) : (
                <div className={`p-2 bg-muted rounded-md ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
                  {profile.full_name || t('common.not_set', 'Niet ingesteld')}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className={isRTL ? 'arabic-text' : ''}>
                {t('user.email', 'E-mailadres')}
              </Label>
              <div className={`p-2 bg-muted rounded-md text-muted-foreground ${getTextAlign('left')}`}>
                {user.email}
              </div>
              <p className={`text-xs text-muted-foreground ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
                {t('user.email_readonly', 'E-mailadres kan niet worden gewijzigd')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className={isRTL ? 'arabic-text' : ''}>
                {t('user.role', 'Rol')}
              </Label>
              <div className="p-2">
                <Badge variant="secondary" className="capitalize">
                  {role || profile.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number" className={isRTL ? 'arabic-text' : ''}>
                {t('user.phone_number', 'Telefoonnummer')}
              </Label>
              {isEditing ? (
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder={t('user.phone_placeholder', 'Voer je telefoonnummer in')}
                  className={isRTL ? 'text-right arabic-numerals' : ''}
                  dir="ltr"
                />
              ) : (
                <div className={`p-2 bg-muted rounded-md ${getTextAlign('left')} arabic-numerals`}>
                  {(profile as Tables<'profiles'>).phone_number || t('common.not_set', 'Niet ingesteld')}
                </div>
              )}
            </div>

            {(profile as Tables<'profiles'>).parent_email && (
              <div className="space-y-2">
                <Label htmlFor="parent_email" className={isRTL ? 'arabic-text' : ''}>
                  {t('user.parent_email', 'Ouder e-mailadres')}
                </Label>
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
                  <span className={isRTL ? 'arabic-text' : ''}>
                    {t('form.cancel')}
                  </span>
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className={getFlexDirection()}
                >
                  <Save className={`h-4 w-4 ${getMarginEnd('2')}`} />
                  <span className={isRTL ? 'arabic-text' : ''}>
                    {isLoading ? t('status.saving') : t('form.save')}
                  </span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className={getFlexDirection()}
              >
                <Edit className={`h-4 w-4 ${getMarginEnd('2')}`} />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {t('form.edit')}
                </span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
