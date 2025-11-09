/**
 * PR9: Extended Gamification Types (SPEELS vs PRESTIGE)
 */

export type GameMode = 'SPEELS' | 'PRESTIGE';

export interface StudentGameProfile {
  student_id: string;
  game_mode: GameMode;
  xp_points: number;
  level: number;
  streak_days: number;
  last_activity_date: string | null;
  avatar_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  challenge_type: 'daily' | 'weekly' | 'special';
  title: string;
  description: string;
  xp_reward: number;
  completion_criteria: Record<string, any>;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  game_mode: GameMode;
}

export interface StudentChallenge {
  id: string;
  student_id: string;
  challenge_id: string;
  progress: Record<string, any>;
  is_completed: boolean;
  completed_at: string | null;
  xp_earned: number;
}

export interface Badge {
  id: string;
  badge_key: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  xp_requirement: number;
  game_mode: GameMode;
  unlock_criteria: Record<string, any>;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  earned_at: string;
  is_showcased: boolean;
}

export interface LeaderboardRanking {
  id: string;
  student_id: string;
  leaderboard_type: 'class' | 'global' | 'niveau';
  scope_id: string | null;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  xp_points: number;
  rank: number;
  calculated_at: string;
}

export interface XPActivity {
  id: string;
  student_id: string;
  activity_type: 'task_completed' | 'challenge_completed' | 'streak_bonus' | 'manual_award';
  xp_earned: number;
  context: Record<string, any>;
  created_at: string;
}
