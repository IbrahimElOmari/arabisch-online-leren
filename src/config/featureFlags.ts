/**
 * Feature flags for Phase 6 - Feature Expansion
 * Toggle features on/off for controlled rollout
 */

export interface FeatureFlags {
  chat: boolean;
  forum: boolean;
  tasks: boolean;
  gamification: boolean;
  notifications: boolean;
  globalSearch: boolean;
  realtime: boolean;
  payments: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  chat: true,
  forum: true,
  tasks: true,
  gamification: true,
  notifications: true,
  globalSearch: true,
  realtime: true,
  payments: import.meta.env.VITE_ENABLE_PAYMENTS === 'true', // default false
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return FEATURE_FLAGS[feature] ?? false;
};