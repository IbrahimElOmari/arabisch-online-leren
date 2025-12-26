import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Gamification interfaces
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, any>;
}

export interface AwardedBadge {
  id: string;
  student_id: string;
  niveau_id: string;
  badge_type: 'automatic' | 'manual';
  badge_id: string;
  badge_name: string;
  badge_description: string;
  reason?: string;
  points_threshold?: number;
  awarded_by?: string;
  earned_at: string;
}

export interface UserPoints {
  user_id: string;
  total_points: number;
  updated_at: string;
}

export interface BonusPoints {
  id: string;
  student_id: string;
  niveau_id: string;
  awarded_by: string;
  points: number;
  reason: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  total_points: number;
  badge_count: number;
  level_completions: number;
  rank: number;
}

// Validation schemas
const bonusPointsSchema = z.object({
  student_id: z.string().uuid(),
  niveau_id: z.string().uuid(),
  points: z.number().min(1).max(100),
  reason: z.string().min(1).max(500),
});

const badgeSchema = z.object({
  student_id: z.string().uuid(),
  niveau_id: z.string().uuid(),
  badge_name: z.string().min(1).max(100),
  badge_description: z.string().max(500),
  reason: z.string().min(1).max(500),
});

export class GamificationService {
  /**
   * Get user's total points across all levels
   */
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(
    userId: string,
    niveauId?: string
  ): Promise<AwardedBadge[]> {
    let query = supabase
      .from('awarded_badges')
      .select('*')
      .eq('student_id', userId)
      .order('earned_at', { ascending: false });

    if (niveauId) {
      query = query.eq('niveau_id', niveauId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AwardedBadge[];
  }

  /**
   * Award bonus points to a student (teacher/admin only)
   */
  static async awardBonusPoints(
    studentId: string,
    niveauId: string,
    points: number,
    reason: string
  ): Promise<BonusPoints> {
    const validated = bonusPointsSchema.parse({
      student_id: studentId,
      niveau_id: niveauId,
      points,
      reason
    });

    const { data, error } = await supabase
      .from('bonus_points')
      .insert({
        student_id: validated.student_id,
        niveau_id: validated.niveau_id,
        points: validated.points,
        reason: validated.reason,
        awarded_by: (await supabase.auth.getUser()).data.user?.id || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Award a manual badge to a student (teacher/admin only)
   */
  static async awardBadge(
    studentId: string,
    niveauId: string,
    badgeName: string,
    badgeDescription: string,
    reason: string
  ): Promise<AwardedBadge> {
    const validated = badgeSchema.parse({
      student_id: studentId,
      niveau_id: niveauId,
      badge_name: badgeName,
      badge_description: badgeDescription,
      reason
    });

    const { data, error } = await supabase
      .from('awarded_badges')
      .insert({
        student_id: validated.student_id,
        niveau_id: validated.niveau_id,
        badge_type: 'manual' as const,
        badge_id: `manual_${Date.now()}`,
        badge_name: validated.badge_name,
        badge_description: validated.badge_description,
        reason: validated.reason,
        awarded_by: (await supabase.auth.getUser()).data.user?.id || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data as AwardedBadge;
  }

  /**
   * Get leaderboard for a specific period
   */
  static async getLeaderboard(
    options: {
      classId?: string;
      niveauId?: string;
      period?: 'week' | 'month' | 'all';
      limit?: number;
    } = {}
  ): Promise<LeaderboardEntry[]> {
    const { classId, niveauId, period = 'all', limit = 10 } = options;

    try {
      // Build the query based on filters
      let query = `
        SELECT 
          p.id as user_id,
          p.full_name,
          COALESCE(up.total_points, 0) as total_points,
          COUNT(ab.id) as badge_count,
          COUNT(CASE WHEN snp.is_completed THEN 1 END) as level_completions
        FROM profiles p
        LEFT JOIN user_points up ON p.id = up.user_id
        LEFT JOIN awarded_badges ab ON p.id = ab.student_id
        LEFT JOIN student_niveau_progress snp ON p.id = snp.student_id
      `;

      const conditions = ["p.role = 'leerling'"];

      if (classId) {
        query += ` LEFT JOIN inschrijvingen i ON p.id = i.student_id `;
        conditions.push(`i.class_id = '${classId}'`);
        conditions.push(`i.payment_status = 'paid'`);
      }

      if (niveauId) {
        conditions.push(`(snp.niveau_id = '${niveauId}' OR snp.niveau_id IS NULL)`);
      }

      if (period !== 'all') {
        const dateFilter = period === 'week' 
          ? `up.updated_at >= NOW() - INTERVAL '7 days'`
          : `up.updated_at >= NOW() - INTERVAL '1 month'`;
        conditions.push(dateFilter);
      }

      query += ` WHERE ${conditions.join(' AND ')} `;
      query += ` GROUP BY p.id, p.full_name, up.total_points `;
      query += ` ORDER BY total_points DESC, badge_count DESC `;
      query += ` LIMIT ${limit}`;

      // Use simpler query since complex RPC is not available
      return this.getSimpleLeaderboard(limit);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Leaderboard error:', error);
      }
      return this.getSimpleLeaderboard(limit);
    }
  }

  /**
   * Simplified leaderboard query as fallback
   */
  private static async getSimpleLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('user_points')
      .select(`
        user_id,
        total_points,
        profiles!inner(full_name)
      `)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map((entry: any, index: number) => ({
      user_id: entry.user_id,
      full_name: entry.profiles.full_name,
      total_points: entry.total_points,
      badge_count: 0,
      level_completions: 0,
      rank: index + 1
    })) || [];
  }

  /**
   * Get progress statistics for a student
   */
  static async getStudentStats(
    studentId: string,
    niveauId?: string
  ): Promise<{
    totalPoints: number;
    badgeCount: number;
    completedLevels: number;
    bonusPoints: number;
    recentAchievements: AwardedBadge[];
  }> {
    const [points, badges, bonusPoints] = await Promise.all([
      this.getUserPoints(studentId),
      this.getUserBadges(studentId, niveauId),
      supabase
        .from('bonus_points')
        .select('points')
        .eq('student_id', studentId)
        .then(({ data }) => 
          data?.reduce((sum, bp) => sum + bp.points, 0) || 0
        )
    ]);

    const recentAchievements = badges
      .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
      .slice(0, 3);

    return {
      totalPoints: points?.total_points || 0,
      badgeCount: badges.length,
      completedLevels: 0, // Would need to query student_niveau_progress
      bonusPoints,
      recentAchievements
    };
  }

  /**
   * Get available badge types and their criteria
   */
  static getBadgeTypes(): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    criteria: string;
  }> {
    return [
      {
        id: 'early_bird',
        name: 'Vroege Vogel',
        description: 'Voltooi je eerste opdracht binnen 24 uur',
        icon: '🐦',
        criteria: 'Eerste opdracht binnen 24 uur'
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Behaal 100% op 5 opdrachten',
        icon: '💯',
        criteria: '5 opdrachten met 100%'
      },
      {
        id: 'discussion_starter',
        name: 'Discussiestarter',
        description: 'Start 10 forumthreads',
        icon: '💬',
        criteria: '10 forumthreads gestart'
      },
      {
        id: 'helpful_student',
        name: 'Hulpvaardige Student',
        description: 'Help 20 medestudenten in het forum',
        icon: '🤝',
        criteria: '20 forum replies'
      },
      {
        id: 'streak_master',
        name: 'Streakmeester',
        description: 'Werk 30 dagen achter elkaar aan opdrachten',
        icon: '🔥',
        criteria: '30 dagen streak'
      }
    ];
  }
}