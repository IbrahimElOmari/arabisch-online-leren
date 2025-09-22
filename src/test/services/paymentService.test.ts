import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMyPayments } from '@/services/paymentService';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// Mock feature flags
vi.mock('@/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    payments: false
  }
}));

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyPayments', () => {
    it('should return empty array when payments are disabled', async () => {
      const result = await getMyPayments();

      expect(result).toEqual([]);
    });

    it('should return consistent empty array structure', async () => {
      const result = await getMyPayments();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});