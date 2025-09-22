import { FEATURE_FLAGS } from '@/config/featureFlags';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type Subscription = {
  id: string;
  user_id: string;
  stripe_subscription_id?: string;
  price_id?: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  current_period_end?: string;
  cancel_at_period_end: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

// Public API
export async function getMySubscriptions(): Promise<Subscription[]> {
  if (!FEATURE_FLAGS.payments) {
    return mockGetMySubscriptions();
  }
  return realGetMySubscriptions();
}

export function useMySubscriptionsQuery() {
  return useQuery({
    queryKey: ['subscriptions', 'my-subscriptions'],
    queryFn: getMySubscriptions,
    enabled: FEATURE_FLAGS.payments
  });
}

export function hasActiveSubscription(subscriptions: Subscription[]): boolean {
  if (!FEATURE_FLAGS.payments) {
    return false;
  }
  return subscriptions.some(sub => sub.status === 'active' || sub.status === 'trialing');
}

// Mock implementations
async function mockGetMySubscriptions(): Promise<Subscription[]> {
  return [];
}

// Real implementations
async function realGetMySubscriptions(): Promise<Subscription[]> {
  // Since subscription tables don't exist yet, return empty array
  // This will be implemented when Stripe is actually enabled
  return [];
}