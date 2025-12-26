import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedStudentProgress {
  id: string;
  student_id: string;
  niveau_id: string;
  total_points: number;
  completed_tasks: number;
  completed_questions: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Enhanced fields
  bonus_points?: number;
  total_points_with_bonus?: number;
  earned_badges?: AwardedBadge[];
  niveau?: {
    id: string;
    naam: string;
    beschrijving: string | null;
    niveau_nummer?: number;
  };
  class_name?: string;
  niveau_name?: string;
  niveau_number?: number;
  badges_count?: number;
}

export interface AwardedBadge {
  id: string;
  badge_id: string;
  badge_name: string;
  badge_description?: string;
  badge_type: 'automatic' | 'leerkracht';
  points_threshold?: number;
  reason?: string;
  earned_at: string;
  awarded_by?: string;
}

const fetchEnhancedStudentProgress = async (userId: string): Promise<EnhancedStudentProgress[]> => {
  // First get the basic progress data
  const { data: progressData, error: progressError } = await supabase
    .from('student_niveau_progress')
    .select('*')
    .eq('student_id', userId)
    .order('created_at', { ascending: false });

  if (progressError) {
    if (import.meta.env.DEV) {
      console.error('Error fetching student progress:', progressError);
    }
    throw progressError;
  }

  if (!progressData || progressData.length === 0) {
    return [];
  }

  // Get all niveau IDs to fetch niveau details
  const niveauIds = progressData.map(p => p.niveau_id);
  
  // Get niveau details
  const { data: niveauData, error: niveauError } = await supabase
    .from('niveaus')
    .select('id, naam, beschrijving, niveau_nummer')
    .in('id', niveauIds);

  if (niveauError) {
    if (import.meta.env.DEV) {
      console.error('Error fetching niveau data:', niveauError);
    }
    throw niveauError;
  }

  // Get bonus points for each niveau
  const { data: bonusData } = await supabase
    .from('bonus_points')
    .select('niveau_id, points')
    .eq('student_id', userId)
    .in('niveau_id', niveauIds);

  // Get awarded badges for each niveau
  const { data: badgeData } = await supabase
    .from('awarded_badges')
    .select('*')
    .eq('student_id', userId)
    .in('niveau_id', niveauIds)
    .order('earned_at', { ascending: false });

  // Create lookup maps
  const niveauMap = new Map(niveauData?.map(n => [n.id, n]) || []);
  
  const bonusPointsMap = new Map();
  bonusData?.forEach(bonus => {
    const existing = bonusPointsMap.get(bonus.niveau_id) || 0;
    bonusPointsMap.set(bonus.niveau_id, existing + bonus.points);
  });

  const badgesMap = new Map();
  badgeData?.forEach(badge => {
    const existing = badgesMap.get(badge.niveau_id) || [];
    existing.push(badge);
    badgesMap.set(badge.niveau_id, existing);
  });

  // Combine all data
  return progressData.map(progress => {
    const bonusPoints = bonusPointsMap.get(progress.niveau_id) || 0;
    const earnedBadges = badgesMap.get(progress.niveau_id) || [];
    
    return {
      ...progress,
      niveau: niveauMap.get(progress.niveau_id),
      bonus_points: bonusPoints,
      total_points_with_bonus: progress.total_points + bonusPoints,
      earned_badges: earnedBadges
    };
  });
};

export const useEnhancedProgress = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['enhanced-student-progress', userId],
    queryFn: () => fetchEnhancedStudentProgress(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes - more frequent updates for gamification
  });

  const refreshProgress = useMutation({
    mutationFn: () => fetchEnhancedStudentProgress(userId!),
    onSuccess: (data) => {
      queryClient.setQueryData(['enhanced-student-progress', userId], data);
      toast({
        title: "Voortgang bijgewerkt",
        description: "Je leervoortgang is succesvol bijgewerkt",
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Failed to refresh progress:', error);
      }
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