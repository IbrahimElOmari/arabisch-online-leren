import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StudentProgress {
  id: string;
  student_id: string;
  niveau_id: string;
  total_points: number;
  completed_tasks: number;
  completed_questions: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  niveau?: {
    id: string;
    naam: string;
    beschrijving?: string;
    niveau_nummer?: number;
  };
}

const fetchStudentProgress = async (userId: string): Promise<StudentProgress[]> => {
  // First get the progress data
  const { data: progressData, error: progressError } = await supabase
    .from('student_niveau_progress')
    .select('*')
    .eq('student_id', userId)
    .order('created_at', { ascending: false });

  if (progressError) {
    console.error('Error fetching student progress:', progressError);
    throw progressError;
  }

  if (!progressData || progressData.length === 0) {
    return [];
  }

  // Get all niveau IDs to fetch niveau details
  const niveauIds = progressData.map(p => p.niveau_id);
  const { data: niveauData, error: niveauError } = await supabase
    .from('niveaus')
    .select('id, naam, beschrijving, niveau_nummer')
    .in('id', niveauIds);

  if (niveauError) {
    console.error('Error fetching niveau data:', niveauError);
    throw niveauError;
  }

  // Create a map for quick lookup
  const niveauMap = new Map(niveauData?.map(n => [n.id, n]) || []);

  // Combine the data
  return progressData.map(progress => ({
    ...progress,
    niveau: niveauMap.get(progress.niveau_id)
  }));
};

export const useStudentProgress = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['student-progress', userId],
    queryFn: () => fetchStudentProgress(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const refreshProgress = useMutation({
    mutationFn: () => fetchStudentProgress(userId!),
    onSuccess: (data) => {
      queryClient.setQueryData(['student-progress', userId], data);
      toast({
        title: "Voortgang bijgewerkt",
        description: "Je leervoortgang is succesvol bijgewerkt",
      });
    },
    onError: (error) => {
      console.error('Failed to refresh progress:', error);
      toast({
        title: "Fout bij bijwerken voortgang",
        description: "Er ging iets mis bij het bijwerken van je voortgang",
        variant: "destructive"
      });
    },
  });

  return {
    progress: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refreshProgress: () => refreshProgress.mutate(),
    isRefreshing: refreshProgress.isPending,
  };
};