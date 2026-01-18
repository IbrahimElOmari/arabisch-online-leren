import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GraduationCap, Video, Calendar, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Lesson {
  id: string;
  title: string;
  class_id: string;
  youtube_url: string | null;
  live_lesson_url: string | null;
  live_lesson_datetime: string | null;
  status: string | null;
  created_at: string;
  klassen?: { name: string } | null;
}

interface Klas {
  id: string;
  name: string;
}

const initialFormData = {
  title: '',
  class_id: '',
  youtube_url: '',
  live_lesson_url: '',
  live_lesson_datetime: '',
  status: 'concept'
};

export default function LessonsAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch lessons
  const { data: lessons, isLoading } = useQuery({
    queryKey: ['admin-lessons-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessen')
        .select(`
          *,
          klassen:class_id (name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lesson[];
    },
  });

  // Fetch classes for dropdown
  const { data: classes } = useQuery({
    queryKey: ['admin-classes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('klassen')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as Klas[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from('lessen')
        .insert({
          title: data.title,
          class_id: data.class_id,
          youtube_url: data.youtube_url || null,
          live_lesson_url: data.live_lesson_url || null,
          live_lesson_datetime: data.live_lesson_datetime || null,
          status: data.status,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons-list'] });
      toast.success(t('management.lessonCreatedTitle', 'Les succesvol aangemaakt'));
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(t('management.errorTitle', 'Er ging iets fout'), {
        description: error.message,
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const { error } = await supabase
        .from('lessen')
        .update({
          title: data.title,
          class_id: data.class_id,
          youtube_url: data.youtube_url || null,
          live_lesson_url: data.live_lesson_url || null,
          live_lesson_datetime: data.live_lesson_datetime || null,
          status: data.status,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons-list'] });
      toast.success(t('management.lessonUpdatedTitle', 'Les succesvol bijgewerkt'));
      resetForm();
      setIsOpen(false);
      setEditingLesson(null);
    },
    onError: (error: any) => {
      toast.error(t('management.errorTitle', 'Er ging iets fout'), {
        description: error.message,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lessen')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons-list'] });
      toast.success(t('management.lessonDeletedTitle', 'Les succesvol verwijderd'));
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast.error(t('management.errorTitle', 'Er ging iets fout'), {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingLesson(null);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      class_id: lesson.class_id,
      youtube_url: lesson.youtube_url || '',
      live_lesson_url: lesson.live_lesson_url || '',
      live_lesson_datetime: lesson.live_lesson_datetime || '',
      status: lesson.status || 'concept',
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.class_id) {
      toast.error(t('management.errorTitle', 'Er ging iets fout'), {
        description: 'Vul alle verplichte velden in',
      });
      return;
    }

    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {t('admin.lessonsManagement', 'Lessen Beheer')}
            </CardTitle>
            <CardDescription>{t('admin.lessonsDescription', 'Overzicht van alle lessen in het systeem')}</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {t('admin.newLesson', 'Nieuwe Les')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingLesson ? t('admin.editLesson', 'Les Bewerken') : t('admin.newLesson', 'Nieuwe Les')}
                </DialogTitle>
                <DialogDescription>
                  {editingLesson 
                    ? t('admin.editLessonDescription', 'Wijzig de gegevens van de les')
                    : t('admin.newLessonDescription', 'Vul de gegevens in om een nieuwe les aan te maken')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">{t('management.lessonTitle', 'Titel')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('management.lessonTitlePlaceholder', 'Voer een titel in')}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="class">{t('management.selectClass', 'Klas')} *</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('management.selectClassPlaceholder', 'Selecteer een klas')} />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((klas) => (
                        <SelectItem key={klas.id} value={klas.id}>
                          {klas.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="youtube_url">{t('management.youtubeUrl', 'YouTube URL')}</Label>
                  <Input
                    id="youtube_url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="live_url">{t('management.liveUrl', 'Live Les URL')}</Label>
                  <Input
                    id="live_url"
                    value={formData.live_lesson_url}
                    onChange={(e) => setFormData({ ...formData, live_lesson_url: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="live_datetime">{t('management.liveDatetime', 'Live Les Datum/Tijd')}</Label>
                  <Input
                    id="live_datetime"
                    type="datetime-local"
                    value={formData.live_lesson_datetime}
                    onChange={(e) => setFormData({ ...formData, live_lesson_datetime: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="status">{t('management.status', 'Status')}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concept">{t('management.statusConcept', 'Concept')}</SelectItem>
                      <SelectItem value="published">{t('management.statusPublished', 'Gepubliceerd')}</SelectItem>
                      <SelectItem value="archived">{t('management.statusArchived', 'Gearchiveerd')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  {t('common.cancel', 'Annuleren')}
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {editingLesson ? t('common.save', 'Opslaan') : t('management.createLesson', 'Aanmaken')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('management.lessonTitle', 'Titel')}</TableHead>
              <TableHead>{t('management.class', 'Klas')}</TableHead>
              <TableHead>{t('management.type', 'Type')}</TableHead>
              <TableHead>{t('management.status', 'Status')}</TableHead>
              <TableHead>{t('management.createdAt', 'Aangemaakt')}</TableHead>
              <TableHead className="text-end">{t('management.actions', 'Acties')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons?.map((lesson) => (
              <TableRow key={lesson.id}>
                <TableCell className="font-medium">{lesson.title}</TableCell>
                <TableCell>{lesson.klassen?.name || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {lesson.youtube_url ? (
                      <><Video className="h-4 w-4" /> Video</>
                    ) : lesson.live_lesson_datetime ? (
                      <><Calendar className="h-4 w-4" /> Live</>
                    ) : (
                      t('management.typeStandard', 'Standaard')
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={lesson.status === 'published' ? 'default' : 'secondary'}>
                    {lesson.status === 'published' 
                      ? t('management.statusPublished', 'Gepubliceerd')
                      : lesson.status === 'archived'
                        ? t('management.statusArchived', 'Gearchiveerd')
                        : t('management.statusConcept', 'Concept')}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(lesson.created_at).toLocaleDateString('nl-NL')}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(lesson)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog open={deleteConfirmId === lesson.id} onOpenChange={(open) => setDeleteConfirmId(open ? lesson.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('management.confirmDelete', 'Verwijderen bevestigen')}</DialogTitle>
                          <DialogDescription>
                            {t('management.confirmDeleteLesson', 'Weet je zeker dat je deze les wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                            {t('common.cancel', 'Annuleren')}
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => deleteMutation.mutate(lesson.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                            {t('common.delete', 'Verwijderen')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {lessons?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('management.noLessons', 'Geen lessen gevonden')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}