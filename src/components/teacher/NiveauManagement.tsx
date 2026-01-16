import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Layers, Plus, Edit, Trash2, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Niveau {
  id: string;
  naam: string;
  class_id: string;
  niveau_nummer: number;
  created_at: string;
}

interface NiveauManagementProps {
  classId: string;
  className?: string;
}

export function NiveauManagement({ classId, className }: NiveauManagementProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNiveau, setEditingNiveau] = useState<Niveau | null>(null);
  const [formData, setFormData] = useState({ naam: '' });

  // Fetch niveaus for this class
  const { data: niveaus, isLoading } = useQuery({
    queryKey: ['class-niveaus', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niveaus')
        .select('id, naam, class_id, niveau_nummer, created_at')
        .eq('class_id', classId)
        .order('niveau_nummer', { ascending: true });
      if (error) throw error;
      return data as Niveau[];
    },
    enabled: !!classId,
  });

  // Create niveau
  const createMutation = useMutation({
    mutationFn: async (naam: string) => {
      const nextOrder = (niveaus?.length || 0) + 1;
      const { error } = await supabase.from('niveaus').insert({
        naam,
        class_id: classId,
        niveau_nummer: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Niveau succesvol aangemaakt');
      queryClient.invalidateQueries({ queryKey: ['class-niveaus', classId] });
      setIsCreateOpen(false);
      setFormData({ naam: '' });
    },
    onError: (error) => {
      console.error('Create niveau error:', error);
      toast.error('Kon niveau niet aanmaken');
    },
  });

  // Update niveau
  const updateMutation = useMutation({
    mutationFn: async ({ id, naam }: { id: string; naam: string }) => {
      const { error } = await supabase.from('niveaus').update({ naam }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Niveau succesvol bijgewerkt');
      queryClient.invalidateQueries({ queryKey: ['class-niveaus', classId] });
      setIsEditOpen(false);
      setEditingNiveau(null);
      setFormData({ naam: '' });
    },
    onError: (error) => {
      console.error('Update niveau error:', error);
      toast.error('Kon niveau niet bijwerken');
    },
  });

  // Delete niveau
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('niveaus').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Niveau succesvol verwijderd');
      queryClient.invalidateQueries({ queryKey: ['class-niveaus', classId] });
    },
    onError: (error) => {
      console.error('Delete niveau error:', error);
      toast.error('Kon niveau niet verwijderen. Mogelijk zijn er nog vragen of taken gekoppeld.');
    },
  });

  const handleCreate = () => {
    if (!formData.naam.trim()) {
      toast.error('Vul een naam in');
      return;
    }
    createMutation.mutate(formData.naam);
  };

  const handleEdit = (niveau: Niveau) => {
    setEditingNiveau(niveau);
    setFormData({ naam: niveau.naam });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingNiveau || !formData.naam.trim()) {
      toast.error('Vul een naam in');
      return;
    }
    updateMutation.mutate({ id: editingNiveau.id, naam: formData.naam });
  };

  const handleDelete = (id: string) => {
    if (confirm('Weet je zeker dat je dit niveau wilt verwijderen? Alle gekoppelde vragen en taken worden ook verwijderd.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {t('teacher.levels', 'Niveaus')}
              {className && <span className="text-muted-foreground font-normal">- {className}</span>}
            </CardTitle>
            <CardDescription>
              {t('teacher.levelsDescription', 'Beheer de niveaus voor deze klas. Per niveau kun je vragen en taken aanmaken.')}
            </CardDescription>
          </div>
          
          {/* CREATE DIALOG */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setFormData({ naam: '' }); setIsCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('teacher.newLevel', 'Nieuw Niveau')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('teacher.createLevel', 'Niveau Aanmaken')}</DialogTitle>
                <DialogDescription>
                  {t('teacher.createLevelDescription', 'Geef een naam voor het nieuwe niveau.')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="naam">{t('teacher.levelName', 'Naam')} *</Label>
                  <Input
                    id="naam"
                    value={formData.naam}
                    onChange={(e) => setFormData({ naam: e.target.value })}
                    placeholder={t('teacher.levelNamePlaceholder', 'bijv. Niveau 1 - Beginners')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  {t('common.cancel', 'Annuleren')}
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('common.create', 'Aanmaken')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : niveaus?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('teacher.noLevels', 'Nog geen niveaus aangemaakt')}</p>
            <p className="text-sm">{t('teacher.createFirstLevel', 'Maak een niveau aan om vragen en taken toe te voegen.')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {niveaus?.map((niveau, index) => (
              <div 
                key={niveau.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{niveau.naam}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('teacher.createdAt', 'Aangemaakt')}: {new Date(niveau.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/teacher/levels/${niveau.id}/questions`}>
                      <BookOpen className="h-4 w-4 mr-1" />
                      {t('teacher.manageQuestions', 'Vragen')}
                    </a>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(niveau)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleDelete(niveau.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('teacher.editLevel', 'Niveau Bewerken')}</DialogTitle>
            <DialogDescription>
              {t('teacher.editLevelDescription', 'Pas de naam van dit niveau aan.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-naam">{t('teacher.levelName', 'Naam')} *</Label>
              <Input
                id="edit-naam"
                value={formData.naam}
                onChange={(e) => setFormData({ naam: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t('common.cancel', 'Annuleren')}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save', 'Opslaan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default NiveauManagement;
