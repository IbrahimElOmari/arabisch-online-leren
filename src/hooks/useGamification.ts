import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Note: These queries will work once PR9 database migration is completed
// For now, this hook is a skeleton that won't be called until tables exist

export const useGamification = (studentId: string) => {
  const queryClient = useQueryClient();

  // Get student game profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['game-profile', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_game_profiles')
        .select('*')
        .eq('student_id', studentId)
        .single();
      
      if (error) {
        // Return null if not found (profile will be created on first XP award)
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },
    enabled: !!studentId
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', profile?.game_mode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .or(`game_mode.eq.${profile?.game_mode},game_mode.eq.BOTH`);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.game_mode
  });

  const { data: studentChallenges = [] } = useQuery({
    queryKey: ['student-challenges', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_challenges')
        .select('*, challenges (*)')
        .eq('student_id', studentId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentId
  });

  // Award XP mutation (will call edge function after PR9)
  const awardXPMutation = useMutation({
    mutationFn: async ({
      xp,
      activityType,
      context
    }: {
      xp: number;
      activityType: string;
      context: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke('award-xp', {
        body: {
          student_id: studentId,
          xp_amount: xp,
          activity_type: activityType,
          context
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['game-profile', studentId] });
      
      if (data?.level_up) {
        toast.success(`Level Up! You're now level ${data.new_level}`, {
          description: `+${data.xp_awarded} XP earned`
        });
      } else {
        toast.success(`+${data?.xp_awarded || 0} XP`, {
          description: data?.message || 'Keep going!'
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to award XP', {
        description: error.message
      });
    }
  });

  // Complete challenge mutation
  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const { data, error } = await supabase.functions.invoke('complete-challenge', {
        body: {
          student_id: studentId,
          challenge_id: challengeId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-challenges', studentId] });
      queryClient.invalidateQueries({ queryKey: ['game-profile', studentId] });
      
      toast.success('Challenge completed!', {
        description: `+${data?.xp_earned || 0} XP earned`
      });
    }
  });

  return {
    profile,
    profileLoading,
    challenges,
    studentChallenges,
    awardXP: awardXPMutation.mutate,
    completeChallenge: completeChallengeMutation.mutate
  };
};
