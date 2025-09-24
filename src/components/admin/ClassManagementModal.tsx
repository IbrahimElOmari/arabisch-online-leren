import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveForm, ResponsiveFormField } from '@/components/forms/ResponsiveForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ClassManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClassData {
  id: string;
  name: string;
  description: string;
  teacher_id: string | null;
  created_at: string;
}

export function ClassManagementModal({ isOpen, onClose }: ClassManagementModalProps) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('klassen')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon klassen niet laden: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Fout',
        description: 'Klas naam is verplicht',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      if (editingClass) {
        const { error } = await supabase
          .from('klassen')
          .update({
            name: formData.name,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClass);

        if (error) throw error;

        toast({
          title: 'Succes',
          description: 'Klas succesvol bijgewerkt'
        });
      } else {
        const { error } = await supabase
          .from('klassen')
          .insert({
            name: formData.name,
            description: formData.description
          });

        if (error) throw error;

        toast({
          title: 'Succes',
          description: 'Nieuwe klas succesvol aangemaakt'
        });
      }

      resetForm();
      fetchClasses();
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classItem: ClassData) => {
    setFormData({
      name: classItem.name,
      description: classItem.description || ''
    });
    setEditingClass(classItem.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (classId: string, className: string) => {
    if (!confirm(`Weet je zeker dat je "${className}" wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('klassen')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Klas succesvol verwijderd'
      });

      fetchClasses();
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingClass(null);
    setShowCreateForm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Klassenbeheer</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showCreateForm ? (
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Alle Klassen</h3>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Klas
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{editingClass ? 'Klas Bewerken' : 'Nieuwe Klas Maken'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveForm layout="single" onSubmit={handleSubmit}>
                  <ResponsiveFormField
                    label="Klas Naam"
                    name="name"
                    type="text"
                    placeholder="Bijv: Arabisch voor Beginners"
                    required
                    value={formData.name}
                    onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                  />
                  <ResponsiveFormField
                    label="Beschrijving"
                    name="description"
                    type="textarea"
                    placeholder="Korte beschrijving van de klas..."
                    value={formData.description}
                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Annuleren
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Bezig...' : (editingClass ? 'Bijwerken' : 'Aanmaken')}
                    </Button>
                  </div>
                </ResponsiveForm>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {loading && classes.length === 0 ? (
              <div className="text-center py-4">Laden...</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen klassen aangemaakt
              </div>
            ) : (
              classes.map((classItem) => (
                <Card key={classItem.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{classItem.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {classItem.description || 'Geen beschrijving'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Aangemaakt: {new Date(classItem.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(classItem)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Bewerken
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(classItem.id, classItem.name)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Verwijderen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}