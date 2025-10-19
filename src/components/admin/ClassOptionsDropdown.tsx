import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreVertical, Users, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ClassOverviewModal from './ClassOverviewModal';

interface ClassOptionsDropdownProps {
  classId: string;
  className: string;
  onRefresh: () => void;
}

export function ClassOptionsDropdown({ classId, className, onRefresh }: ClassOptionsDropdownProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('klassen')
        .delete()
        .eq('id', classId);
      
      if (error) throw error;
      
      toast({
        title: 'Succes',
        description: `Klas "${className}" is succesvol verwijderd`
      });
      
      onRefresh();
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het verwijderen',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    const newName = prompt('Nieuwe naam:', className);
    if (newName && newName !== className) {
      try {
        const { error } = await supabase
          .from('klassen')
          .update({ name: newName })
          .eq('id', classId);
        
        if (error) throw error;
        
        toast({
          title: 'Succes',
          description: 'Klas naam succesvol bijgewerkt'
        });
        
        onRefresh();
      } catch (error: any) {
        toast({
          title: 'Fout',
          description: error.message || 'Er is een fout opgetreden',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <ClassOverviewModal
            classId={classId}
            className={className}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Users className="h-4 w-4 me-2" />
                Overzicht Leerlingen
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="h-4 w-4 me-2" />
            Bewerken/Beheren
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 me-2" />
            Verwijder Klas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dit zal de klas "{className}" permanent verwijderen, inclusief alle gerelateerde niveaus, 
              inschrijvingen en lessen. Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Bezig...' : 'Ja, verwijderen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}