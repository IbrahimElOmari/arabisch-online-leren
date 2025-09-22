/**
 * Feature flags for Phase 8 - Complete Admin Operations
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
  admin: boolean;
  moderation: boolean;
  backups: boolean;
  maintenanceMode: boolean;
  gdprTools: boolean;
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
  admin: import.meta.env.VITE_ENABLE_ADMIN === 'true' || true,
  moderation: import.meta.env.VITE_ENABLE_MODERATION === 'true' || true,
  backups: import.meta.env.VITE_ENABLE_BACKUPS === 'true' || true,
  maintenanceMode: import.meta.env.VITE_ENABLE_MAINTENANCE_MODE === 'true' || false,
  gdprTools: import.meta.env.VITE_ENABLE_GDPR_TOOLS === 'true' || true,
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return FEATURE_FLAGS[feature] ?? false;
};