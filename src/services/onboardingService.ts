/**
 * Onboarding Service
 * Handles user onboarding flow, study groups, and welcome emails
 */

import { supabase } from '@/integrations/supabase/client';

// ==================== TYPES ====================

export interface UserOnboarding {
  id: string;
  user_id: string;
  current_step: number | null;
  completed_steps: string[];
  tour_completed: boolean | null;
  welcome_email_sent: boolean | null;
  study_group_matched: boolean | null;
  preferences: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
  last_activity: string | null;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  niveau_id: string | null;
  max_members: number | null;
  current_members: number | null;
  meeting_schedule: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
}

export interface StudyGroupMember {
  id: string;
  group_id: string | null;
  user_id: string | null;
  role: string | null;
  joined_at: string | null;
}

export interface StudyGroupInput {
  name: string;
  description?: string;
  niveau_id?: string;
  max_members?: number;
  meeting_schedule?: string;
  meeting_day?: string;
  meeting_time?: string;
}

export interface UpdateOnboarding {
  current_step?: number;
  completed_steps?: string[];
  tour_completed?: boolean;
  study_group_matched?: boolean;
  preferences?: Record<string, any>;
  completed_at?: string;
}

export interface MatchingPreferences {
  level?: string;
  goals?: string[];
  schedule?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  language?: 'nl' | 'en' | 'ar';
}

// ==================== USER ONBOARDING ====================

export const getOrCreateOnboarding = async (): Promise<UserOnboarding | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to get existing onboarding
  const { data: existing } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return {
      ...existing,
      completed_steps: (existing.completed_steps as string[]) || [],
      preferences: (existing.preferences as Record<string, any>) || {},
    };
  }

  // Create new onboarding record
  const { data: newOnboarding, error } = await supabase
    .from('user_onboarding')
    .insert({
      user_id: user.id,
      current_step: 1,
      completed_steps: [],
      preferences: {},
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...newOnboarding,
    completed_steps: (newOnboarding.completed_steps as string[]) || [],
    preferences: (newOnboarding.preferences as Record<string, any>) || {},
  };
};

export const getOnboardingStatus = async (): Promise<UserOnboarding | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return {
    ...data,
    completed_steps: (data.completed_steps as string[]) || [],
    preferences: (data.preferences as Record<string, any>) || {},
  };
};

export const updateOnboarding = async (updates: UpdateOnboarding): Promise<UserOnboarding> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_onboarding')
    .update({
      ...updates,
      last_activity: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    completed_steps: (data.completed_steps as string[]) || [],
    preferences: (data.preferences as Record<string, any>) || {},
  };
};

export const completeOnboardingStep = async (step: string): Promise<UserOnboarding> => {
  const current = await getOnboardingStatus();
  if (!current) throw new Error('Onboarding not found');

  const completedSteps = [...current.completed_steps, step];
  const isComplete = completedSteps.length >= 5;

  return updateOnboarding({
    completed_steps: completedSteps,
    current_step: Math.min((current.current_step || 1) + 1, 6),
    ...(isComplete ? { completed_at: new Date().toISOString() } : {}),
  });
};

export const completeTour = async (): Promise<void> => {
  await updateOnboarding({ tour_completed: true });
};

export const isOnboardingComplete = async (): Promise<boolean> => {
  const status = await getOnboardingStatus();
  return status?.completed_at !== null || status?.tour_completed === true;
};

export const shouldShowOnboarding = async (): Promise<boolean> => {
  const status = await getOnboardingStatus();
  if (!status) return true; // New user, show onboarding
  return !status.completed_at && !status.tour_completed;
};

// ==================== STUDY GROUPS ====================

export const getStudyGroups = async (): Promise<StudyGroup[]> => {
  const { data, error } = await supabase
    .from('study_groups')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getAvailableStudyGroups = async (): Promise<StudyGroup[]> => {
  const allGroups = await getStudyGroups();
  return allGroups.filter(g => (g.current_members || 0) < (g.max_members || 10));
};

export const getStudyGroupById = async (id: string): Promise<StudyGroup | null> => {
  const { data, error } = await supabase
    .from('study_groups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const createStudyGroup = async (input: StudyGroupInput): Promise<StudyGroup> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('study_groups')
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-join as leader
  await joinStudyGroup(data.id, 'leader');

  return data;
};

export const joinStudyGroup = async (groupId: string, role: 'member' | 'leader' = 'member'): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('study_group_members')
    .insert({
      group_id: groupId,
      user_id: user.id,
      role,
    });

  if (error) throw error;

  // Update onboarding
  await updateOnboarding({ study_group_matched: true });
};

export const leaveStudyGroup = async (groupId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('study_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const getGroupMembers = async (groupId: string): Promise<StudyGroupMember[]> => {
  const { data, error } = await supabase
    .from('study_group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getUserGroups = async (): Promise<StudyGroup[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships, error: memberError } = await supabase
    .from('study_group_members')
    .select('group_id')
    .eq('user_id', user.id);

  if (memberError) throw memberError;
  if (!memberships?.length) return [];

  const groupIds = memberships.map(m => m.group_id).filter((id): id is string => id !== null);
  if (!groupIds.length) return [];
  
  const { data: groups, error } = await supabase
    .from('study_groups')
    .select('*')
    .in('id', groupIds);

  if (error) throw error;
  return groups || [];
};

// ==================== STUDY GROUP MATCHING ====================

export const matchStudyGroups = async (preferences: MatchingPreferences): Promise<StudyGroup[]> => {
  const groups = await getAvailableStudyGroups();
  
  // Calculate match scores
  const scoredGroups = groups.map(group => {
    let score = 0;
    
    // Level match (40% weight)
    if (preferences.level && group.niveau_id === preferences.level) {
      score += 40;
    }
    
    // Schedule match (20% weight)
    if (preferences.schedule) {
      const timeMap: Record<string, string[]> = {
        morning: ['08:00', '09:00', '10:00', '11:00'],
        afternoon: ['12:00', '13:00', '14:00', '15:00', '16:00'],
        evening: ['17:00', '18:00', '19:00', '20:00', '21:00'],
      };
      
      if (group.meeting_time) {
        const hour = group.meeting_time.split(':')[0] + ':00';
        if (preferences.schedule === 'flexible' || 
            timeMap[preferences.schedule]?.includes(hour)) {
          score += 20;
        }
      }
    }
    
    // Availability bonus (members < 50% capacity)
    if ((group.current_members || 0) < (group.max_members || 10) / 2) {
      score += 10;
    }
    
    return { group, score };
  });
  
  // Sort by score and return top 3
  return scoredGroups
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(sg => sg.group);
};

// ==================== ONBOARDING PREFERENCES ====================

export const saveOnboardingPreferences = async (preferences: Record<string, any>): Promise<void> => {
  const current = await getOnboardingStatus();
  if (!current) throw new Error('Onboarding not found');

  await updateOnboarding({
    preferences: {
      ...current.preferences,
      ...preferences,
    },
  });
};

export const getOnboardingPreferences = async (): Promise<Record<string, any>> => {
  const status = await getOnboardingStatus();
  return status?.preferences || {};
};

// ==================== TOUR CONFIGURATION ====================

export const getDefaultTourStops = () => [
  {
    id: 'dashboard',
    target: '[data-tour="dashboard"]',
    title: 'Je Dashboard',
    content: 'Dit is je persoonlijke dashboard waar je je voortgang en activiteiten ziet.',
    placement: 'bottom' as const,
  },
  {
    id: 'lessons',
    target: '[data-tour="lessons"]',
    title: 'Lessen',
    content: 'Hier vind je alle beschikbare lessen. Klik om te beginnen met leren!',
    placement: 'right' as const,
  },
  {
    id: 'forum',
    target: '[data-tour="forum"]',
    title: 'Community Forum',
    content: 'Stel vragen, deel ervaringen en leer van anderen in de community.',
    placement: 'right' as const,
  },
  {
    id: 'profile',
    target: '[data-tour="profile"]',
    title: 'Je Profiel',
    content: 'Beheer je account, bekijk je badges en pas je voorkeuren aan.',
    placement: 'left' as const,
  },
  {
    id: 'help',
    target: '[data-tour="help"]',
    title: 'Hulp & Support',
    content: 'Hulp nodig? Klik hier voor FAQ, tutorials en contact met support.',
    placement: 'top' as const,
  },
];
