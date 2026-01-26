/**
 * Onboarding Zod Schemas
 * Validation for user onboarding, study groups, and welcome emails
 */

import { z } from 'zod';

// Onboarding Steps
export const onboardingStepSchema = z.enum([
  'welcome',
  'profile',
  'goals',
  'tour',
  'study_group',
  'complete'
]);

// User Preferences Schema
export const onboardingPreferencesSchema = z.object({
  learning_goals: z.array(z.string()).default([]),
  preferred_schedule: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
  weekly_hours: z.number().int().min(1).max(40).optional(),
  preferred_language: z.enum(['nl', 'en', 'ar']).default('nl'),
  notification_preferences: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    reminders: z.boolean().default(true),
  }).default({}),
});

// User Onboarding State Schema
export const userOnboardingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  current_step: z.number().int().min(1).max(6).default(1),
  completed_steps: z.array(z.string()).default([]),
  tour_completed: z.boolean().default(false),
  welcome_email_sent: z.boolean().default(false),
  study_group_matched: z.boolean().default(false),
  preferences: onboardingPreferencesSchema.default({}),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
  last_activity: z.string().datetime(),
});

export const updateOnboardingSchema = z.object({
  current_step: z.number().int().min(1).max(6).optional(),
  completed_steps: z.array(z.string()).optional(),
  tour_completed: z.boolean().optional(),
  preferences: onboardingPreferencesSchema.partial().optional(),
});

export type UserOnboarding = z.infer<typeof userOnboardingSchema>;
export type OnboardingPreferences = z.infer<typeof onboardingPreferencesSchema>;
export type UpdateOnboarding = z.infer<typeof updateOnboardingSchema>;
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;

// Study Group Schemas
export const studyGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().nullable(),
  niveau_id: z.string().uuid().nullable(),
  max_members: z.number().int().positive().default(10),
  current_members: z.number().int().default(0),
  meeting_schedule: z.enum(['weekly', 'bi-weekly', 'monthly']).nullable(),
  meeting_day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).nullable(),
  meeting_time: z.string().nullable(), // HH:MM format
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});

export const studyGroupInputSchema = studyGroupSchema.omit({
  id: true,
  current_members: true,
  created_at: true,
});

export const studyGroupMemberSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['member', 'leader', 'moderator']).default('member'),
  joined_at: z.string().datetime(),
});

export type StudyGroup = z.infer<typeof studyGroupSchema>;
export type StudyGroupInput = z.infer<typeof studyGroupInputSchema>;
export type StudyGroupMember = z.infer<typeof studyGroupMemberSchema>;

// Welcome Email Queue Schema
export const emailTypeSchema = z.enum(['welcome', 'day1', 'day3', 'day7']);

export const welcomeEmailQueueSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  email_type: emailTypeSchema,
  scheduled_for: z.string().datetime(),
  sent_at: z.string().datetime().nullable(),
  status: z.enum(['pending', 'sent', 'failed']).default('pending'),
  created_at: z.string().datetime(),
});

export type WelcomeEmailQueue = z.infer<typeof welcomeEmailQueueSchema>;
export type EmailType = z.infer<typeof emailTypeSchema>;

// Tour Configuration
export const tourStopSchema = z.object({
  id: z.string(),
  target: z.string(), // CSS selector
  title: z.string(),
  content: z.string(),
  placement: z.enum(['top', 'bottom', 'left', 'right']).default('bottom'),
  action: z.string().optional(),
});

export const tourConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  steps: z.array(tourStopSchema),
});

export type TourStop = z.infer<typeof tourStopSchema>;
export type TourConfig = z.infer<typeof tourConfigSchema>;

// Study Group Matching
export const matchingPreferencesSchema = z.object({
  level: z.string().uuid().optional(),
  goals: z.array(z.string()).default([]),
  schedule: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
  language: z.enum(['nl', 'en', 'ar']).optional(),
});

export type MatchingPreferences = z.infer<typeof matchingPreferencesSchema>;
