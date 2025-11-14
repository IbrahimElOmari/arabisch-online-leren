import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchTeacherNotes, 
  createTeacherNote, 
  updateTeacherNote, 
  deleteTeacherNote 
} from '@/services/teacherService';
import { toast } from 'sonner';

export function useStudentNotes(studentId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['teacherNotes', studentId],
    queryFn: () => fetchTeacherNotes(studentId!),
    enabled: !!studentId,
  });

  const createMutation = useMutation({
    mutationFn: createTeacherNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherNotes', studentId] });
      toast.success('Note created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create note: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: any }) => 
      updateTeacherNote(noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherNotes', studentId] });
      toast.success('Note updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update note: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeacherNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherNotes', studentId] });
      toast.success('Note deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete note: ${error.message}`);
    },
  });

  return {
    notes: notes || [],
    isLoading,
    error,
    createNote: createMutation.mutate,
    updateNote: updateMutation.mutate,
    deleteNote: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
