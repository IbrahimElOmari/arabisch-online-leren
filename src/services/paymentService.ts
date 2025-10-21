import { FEATURE_FLAGS } from '@/config/featureFlags';

import { useQuery } from '@tanstack/react-query';

export type Payment = {
  id: string;
  user_id: string;
  class_id?: string;
  checkout_session_id?: string;
  amount?: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  metadata: Record<string, any>;
  created_at: string;
};

// Public API
export async function getMyPayments(): Promise<Payment[]> {
  if (!FEATURE_FLAGS.payments) {
    return mockGetMyPayments();
  }
  return realGetMyPayments();
}

export function useMyPaymentsQuery() {
  return useQuery({
    queryKey: ['payments', 'my-payments'],
    queryFn: getMyPayments,
    enabled: FEATURE_FLAGS.payments
  });
}

// Mock implementations
async function mockGetMyPayments(): Promise<Payment[]> {
  return [];
}

// Real implementations
async function realGetMyPayments(): Promise<Payment[]> {
  // Since payment tables don't exist yet, return empty array
  // This will be implemented when Stripe is actually enabled
  return [];
}