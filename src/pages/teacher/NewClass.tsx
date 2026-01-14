import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NewClass() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; teacher_id: string }) => {
      const { data: result, error } = await supabase
        .from('klassen')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      toast.success(t('teacher.classCreated', 'Klas succesvol aangemaakt'));
      navigate(`/teacher/classes/${data.id}`);
    },
    onError: (error) => {
      console.error('Failed to create class:', error);
      toast.error(t('teacher.classCreateError', 'Kon klas niet aanmaken'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      toast.error(t('auth.notLoggedIn', 'Je bent niet ingelogd'));
      return;
    }
    createMutation.mutate({
      ...formData,
      teacher_id: profile.id,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common.back', 'Terug')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('teacher.createClass', 'Nieuwe Klas Aanmaken')}
          </CardTitle>
          <CardDescription>
            {t('teacher.createClassDescription', 'Vul de gegevens in om een nieuwe klas aan te maken')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('teacher.className', 'Naam van de klas')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('teacher.classNamePlaceholder', 'bijv. Arabisch Niveau 1 - 2024')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('teacher.classDescription', 'Beschrijving')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('teacher.classDescriptionPlaceholder', 'Beschrijf de inhoud en doelstellingen van deze klas...')}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                {t('common.cancel', 'Annuleren')}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !formData.name}
                className="flex-1"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.creating', 'Aanmaken...')}
                  </>
                ) : (
                  t('teacher.createClass', 'Klas Aanmaken')
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
