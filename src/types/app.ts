
/**
 * Centralized TypeScript interfaces for the application
 */

import type { AppRole } from './roles';

export type UserRole = AppRole;

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  parent_email?: string;
  email?: string;
  phone_number?: string;
  age?: number;
  theme_preference?: 'auto' | 'playful' | 'clean' | 'professional';
}

export interface EnrolledClass {
  id: string;
  class_id: string;
  payment_status: string;
  klassen: {
    id: string;
    name: string;
    description: string;
  };
}

export type BackendHealthStatus = 'ok' | 'degraded' | 'down';

export interface AuthContextType {
  user: any;
  session: any;
  profile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
  isRefreshing: boolean;
}
