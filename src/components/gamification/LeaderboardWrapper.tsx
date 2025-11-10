// PR9 Leaderboard Wrapper - adapts PR9 leaderboard data to existing Leaderboard component
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Leaderboard as BaseLeaderboard } from '@/components/gamification/Leaderboard';
import type { LeaderboardEntry } from '@/services/gamificationService';

interface LeaderboardWrapperProps {
  leaderboardType?: 'class' | 'global' | 'niveau';
  scopeId?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  gameMode: 'SPEELS' | 'PRESTIGE';
}

export const Leaderboard = ({ 
  leaderboardType = 'global', 
  scopeId, 
  period = 'all_time',
  gameMode 
}: LeaderboardWrapperProps) => {
  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['leaderboard-pr9', leaderboardType, scopeId, period],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      let query = supabase
        .from('leaderboard_rankings')
        .select(`
          rank,
          student_id,
          xp_points,
          profiles:student_id (
            full_name
          )
        `)
        .eq('leaderboard_type', leaderboardType)
        .eq('period', period)
        .order('rank', { ascending: true })
        .limit(50);

      if (scopeId) {
        query = query.eq('scope_id', scopeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform to LeaderboardEntry format
      return (data || []).map((item: any) => ({
        user_id: item.student_id,
        full_name: item.profiles?.full_name || 'Unknown User',
        total_points: item.xp_points,
        badge_count: 0, // TODO: Could join with student_badges
        level_completions: 0, // TODO: Could calculate from enrollments
        rank: item.rank
      }));
    }
  });

  // Map period to existing Leaderboard period type
  const mappedPeriod = period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'all';

  return (
    <BaseLeaderboard
      entries={rankings}
      isLoading={isLoading}
      period={mappedPeriod as 'week' | 'month' | 'all'}
      className={gameMode === 'SPEELS' ? 'border-primary/20' : 'border-accent/20'}
    />
  );
};
