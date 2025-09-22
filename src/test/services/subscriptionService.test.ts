import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMySubscriptions, hasActiveSubscription } from '@/services/subscriptionService';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// Mock feature flags
vi.mock('@/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    payments: false
  }
}));

describe('subscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMySubscriptions', () => {
    it('should return empty array when payments are disabled', async () => {
      const result = await getMySubscriptions();

      expect(result).toEqual([]);
    });

    it('should return consistent empty array structure', async () => {
      const result = await getMySubscriptions();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return false when payments are disabled', () => {
      const subscriptions = [];
      const result = hasActiveSubscription(subscriptions);

      expect(result).toBe(false);
    });

    it('should return false for empty subscriptions when payments disabled', () => {
      const subscriptions: any[] = [];
      const result = hasActiveSubscription(subscriptions);

      expect(result).toBe(false);
    });
  });
});