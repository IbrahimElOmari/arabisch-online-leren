import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckoutSession, createPortalSession, ensureCustomer } from '@/services/stripeService';

// Mock feature flags
vi.mock('@/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    payments: false
  }
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('stripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should return mock URL when payments are disabled', async () => {
      const params = {
        mode: 'payment' as const,
        classId: 'class-123'
      };

      const result = await createCheckoutSession(params);

      expect(result).toEqual({
        url: '/billing/coming-soon'
      });
    });

    it('should handle payment mode', async () => {
      const params = {
        mode: 'payment' as const,
        classId: 'class-123'
      };

      const result = await createCheckoutSession(params);

      expect(result.url).toBe('/billing/coming-soon');
    });

    it('should handle subscription mode', async () => {
      const params = {
        mode: 'subscription' as const,
        priceId: 'price_123'
      };

      const result = await createCheckoutSession(params);

      expect(result.url).toBe('/billing/coming-soon');
    });
  });

  describe('createPortalSession', () => {
    it('should return mock URL when payments are disabled', async () => {
      const result = await createPortalSession();

      expect(result).toEqual({
        url: '/billing/coming-soon'
      });
    });
  });

  describe('ensureCustomer', () => {
    it('should be no-op when payments are disabled', async () => {
      await expect(ensureCustomer()).resolves.toBeUndefined();
    });
  });
});