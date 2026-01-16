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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClipboardList, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Niveau {
  id: string;
  naam: string;
  class_id: string;
  klassen?: { name: string } | null;
}

interface Vraag {
  id: string;
  vraag_tekst: string;
  vraag_type: string;
  niveau_id: string;
  correct_antwoord: any;
  opties: any;
  created_at: string;
  niveaus: { naam: string } | null;
}

export default function TasksAdmin() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingVraag, setEditingVraag] = useState<Vraag | null>(null);
  const [formData, setFormData] = useState({
    vraag_tekst: '',
    vraag_type: 'open',
    niveau_id: '',
    correct_antwoord: '',
    opties: '',
  });

  // Fetch all niveaus for dropdown
  const { data: niveaus } = useQuery({
    queryKey: ['admin-niveaus-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niveaus')
        .select('id, naam, class_id, klassen(name)')
        .order('naam');
      if (error) throw error;
      return data as Niveau[];
    },
  });

  // Fetch all vragen
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['admin-tasks-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vragen')
        .select(`
          *,
          niveaus:niveau_id (naam)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Vraag[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const insertData: any = {
        vraag_tekst: data.vraag_tekst,
        vraag_type: data.vraag_type,
        niveau_id: data.niveau_id,
      };
      
      if (data.correct_antwoord) {
        insertData.correct_antwoord = data.correct_antwoord;
      }
      
      if (data.opties && data.vraag_type === 'multiple_choice') {
        insertData.opties = data.opties.split('\n').filter(o => o.trim());
      }
      
      const { error } = await supabase.from('vragen').insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vraag succesvol aangemaakt');
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error('Kon vraag niet aanmaken');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const updateData: any = {
        vraag_tekst: data.vraag_tekst,
        vraag_type: data.vraag_type,
        niveau_id: data.niveau_id,
      };
      
      if (data.correct_antwoord) {
        updateData.correct_antwoord = data.correct_antwoord;
      }
      
      if (data.opties && data.vraag_type === 'multiple_choice') {
        updateData.opties = data.opties.split('\n').filter(o => o.trim());
      }
      
      const { error } = await supabase.from('vragen').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vraag succesvol bijgewerkt');
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      setIsEditOpen(false);
      setEditingVraag(null);
      resetForm();
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Kon vraag niet bijwerken');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vragen').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vraag succesvol verwijderd');
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Kon vraag niet verwijderen');
    },
  });

  const resetForm = () => {
    setFormData({
      vraag_tekst: '',
      vraag_type: 'open',
      niveau_id: '',
      correct_antwoord: '',
      opties: '',
    });
  };

  const handleCreate = () => {
    if (!formData.vraag_tekst || !formData.niveau_id) {
      toast.error('Vul verplichte velden in');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (vraag: Vraag) => {
    setEditingVraag(vraag);
    setFormData({
      vraag_tekst: vraag.vraag_tekst,
      vraag_type: vraag.vraag_type || 'open',
      niveau_id: vraag.niveau_id,
      correct_antwoord: typeof vraag.correct_antwoord === 'string' 
        ? vraag.correct_antwoord 
        : JSON.stringify(vraag.correct_antwoord || ''),
      opties: Array.isArray(vraag.opties) ? vraag.opties.join('\n') : '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingVraag || !formData.vraag_tekst || !formData.niveau_id) {
      toast.error('Vul verplichte velden in');
      return;
    }
    updateMutation.mutate({ id: editingVraag.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (confirm('Weet je zeker dat je deze vraag wilt verwijderen?')) {
      deleteMutation.mutate(id);
    }
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="niveau_id">Niveau *</Label>
        <Select value={formData.niveau_id} onValueChange={(v) => setFormData({ ...formData, niveau_id: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecteer niveau" />
          </SelectTrigger>
          <SelectContent>
            {niveaus?.map((niveau) => (
              <SelectItem key={niveau.id} value={niveau.id}>
                {niveau.naam} {niveau.klassen?.name ? `(${niveau.klassen.name})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="vraag_tekst">Vraag tekst *</Label>
        <Textarea
          id="vraag_tekst"
          value={formData.vraag_tekst}
          onChange={(e) => setFormData({ ...formData, vraag_tekst: e.target.value })}
          placeholder="Typ de vraag..."
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="vraag_type">Type vraag</Label>
        <Select value={formData.vraag_type} onValueChange={(v) => setFormData({ ...formData, vraag_type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open vraag</SelectItem>
            <SelectItem value="multiple_choice">Meerkeuze</SelectItem>
            <SelectItem value="true_false">Waar/Onwaar</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {formData.vraag_type === 'multiple_choice' && (
        <div className="space-y-2">
          <Label htmlFor="opties">Opties (één per regel)</Label>
          <Textarea
            id="opties"
            value={formData.opties}
            onChange={(e) => setFormData({ ...formData, opties: e.target.value })}
            placeholder="Optie A&#10;Optie B&#10;Optie C&#10;Optie D"
            rows={4}
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="correct_antwoord">Correct antwoord</Label>
        <Input
          id="correct_antwoord"
          value={formData.correct_antwoord}
          onChange={(e) => setFormData({ ...formData, correct_antwoord: e.target.value })}
          placeholder="Het juiste antwoord..."
        />
      </div>
    </div>
  );

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
              <ClipboardList className="h-5 w-5" />
              Taken & Vragen Beheer
            </CardTitle>
            <CardDescription>Overzicht van alle vragen en taken in het systeem</CardDescription>
          </div>
          
          {/* CREATE DIALOG */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Vraag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nieuwe Vraag Aanmaken</DialogTitle>
                <DialogDescription>
                  Vul de gegevens in om een nieuwe vraag toe te voegen.
                </DialogDescription>
              </DialogHeader>
              <FormFields />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuleren</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Aanmaken
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
              <TableHead>Vraag</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Aangemaakt</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks?.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {task.vraag_tekst}
                </TableCell>
                <TableCell>{task.niveaus?.naam || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{task.vraag_type || 'open'}</Badge>
                </TableCell>
                <TableCell>{new Date(task.created_at).toLocaleDateString('nl-NL')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(task)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDelete(task.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {tasks?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Geen taken gevonden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vraag Bewerken</DialogTitle>
            <DialogDescription>
              Pas de gegevens van deze vraag aan.
            </DialogDescription>
          </DialogHeader>
          <FormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuleren</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
