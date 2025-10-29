/**
 * Type definitions for Gamification (F4)
 */

export interface StudentTopicProgress {
  id: string;
  student_id: string;
  niveau_id: string | null;
  module_id: string | null;
  topic_name: string;
  completion_percentage: number | null;
  mastery_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  exercises_completed: number;
  exercises_total: number;
  last_practiced: string | null;
  updated_at: string;
}

export interface AchievementDefinition {
  id: string;
  achievement_id: string;
  achievement_name: string;
  achievement_description: string | null;
  achievement_icon: string | null;
  achievement_category: string | null;
  achievement_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  unlock_criteria: Record<string, any>;
  points_value: number;
  is_hidden: boolean;
  created_at: string;
}

export interface StudentAchievement {
  id: string;
  student_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress_data: Record<string, any> | null;
  is_showcased: boolean;
}

export interface LeaderboardEntry {
  id: string;
  student_id: string;
  leaderboard_type: 'class' | 'global' | 'topic';
  scope_id: string | null;
  time_period: 'daily' | 'weekly' | 'monthly' | 'all_time' | null;
  score: number;
  rank: number | null;
  calculated_at: string;
}

export interface StudentWallet {
  student_id: string;
  total_xp: number;
  current_level: number;
  virtual_coins: number;
  streak_days: number;
  last_activity_date: string | null;
  last_xp_update: string;
}

export interface RewardItem {
  id: string;
  item_name: string;
  item_type: 'theme' | 'avatar' | 'badge_frame' | 'profile_background' | null;
  item_description: string | null;
  item_data: Record<string, any> | null;
  cost_coins: number;
  cost_xp: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | null;
  is_available: boolean;
}

export interface StudentInventory {
  id: string;
  student_id: string;
  item_id: string;
  acquired_at: string;
  is_equipped: boolean;
}

export interface ActivityFeedItem {
  id: string;
  student_id: string;
  activity_type: string;
  activity_data: Record<string, any>;
  visibility: 'public' | 'friends' | 'private';
  created_at: string;
}
