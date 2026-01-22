import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as stripeService from '@/services/stripeService';
import { supabase } from '@/integrations/supabase/client';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    payments: false,
  },
}));

describe('StripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    describe('when payments are disabled', () => {
      beforeEach(() => {
        vi.mocked(FEATURE_FLAGS).payments = false;
      });

      it('should return mock checkout URL', async () => {
        const result = await stripeService.createCheckoutSession({
          mode: 'payment',
          classId: 'class-1',
        });
        
        expect(result.url).toBe('/billing/coming-soon');
        expect(supabase.functions.invoke).not.toHaveBeenCalled();
      });
    });

    describe('when payments are enabled', () => {
      beforeEach(() => {
        vi.mocked(FEATURE_FLAGS).payments = true;
      });

      it('should call edge function for real checkout', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: { url: 'https://checkout.stripe.com/session/123' },
          error: null,
        });

        const result = await stripeService.createCheckoutSession({
          mode: 'payment',
          classId: 'class-1',
        });
        
        expect(supabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', {
          body: { mode: 'payment', classId: 'class-1' },
        });
        expect(result.url).toBe('https://checkout.stripe.com/session/123');
      });

      it('should throw error on edge function failure', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: null,
          error: { message: 'Stripe error' },
        });

        await expect(
          stripeService.createCheckoutSession({ mode: 'subscription' })
        ).rejects.toThrow('Failed to create checkout session');
      });

      it('should support subscription mode', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: { url: 'https://checkout.stripe.com/sub/456' },
          error: null,
        });

        const result = await stripeService.createCheckoutSession({
          mode: 'subscription',
          priceId: 'price_123',
        });
        
        expect(supabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', {
          body: expect.objectContaining({ mode: 'subscription', priceId: 'price_123' }),
        });
        expect(result.url).toContain('stripe.com');
      });
    });
  });

  describe('createPortalSession', () => {
    describe('when payments are disabled', () => {
      beforeEach(() => {
        vi.mocked(FEATURE_FLAGS).payments = false;
      });

      it('should return mock portal URL', async () => {
        const result = await stripeService.createPortalSession();
        
        expect(result.url).toBe('/billing/coming-soon');
        expect(supabase.functions.invoke).not.toHaveBeenCalled();
      });
    });

    describe('when payments are enabled', () => {
      beforeEach(() => {
        vi.mocked(FEATURE_FLAGS).payments = true;
      });

      it('should call edge function for real portal', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: { url: 'https://billing.stripe.com/portal/123' },
          error: null,
        });

        const result = await stripeService.createPortalSession();
        
        expect(supabase.functions.invoke).toHaveBeenCalledWith('create-portal-session');
        expect(result.url).toContain('stripe.com');
      });

      it('should throw error on failure', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: null,
          error: { message: 'Portal error' },
        });

        await expect(stripeService.createPortalSession()).rejects.toThrow(
          'Failed to create portal session'
        );
      });
    });
  });

  describe('ensureCustomer', () => {
    describe('when payments are disabled', () => {
      beforeEach(() => {
        vi.mocked(FEATURE_FLAGS).payments = false;
      });

      it('should be a no-op', async () => {
        await stripeService.ensureCustomer();
        
        expect(supabase.functions.invoke).not.toHaveBeenCalled();
      });
    });

    describe('when payments are enabled', () => {
      beforeEach(() => {
        vi.mocked(FEATURE_FLAGS).payments = true;
      });

      it('should call edge function to ensure customer exists', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: {},
          error: null,
        });

        await stripeService.ensureCustomer();
        
        expect(supabase.functions.invoke).toHaveBeenCalledWith('ensure-stripe-customer');
      });

      it('should throw error on failure', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: null,
          error: { message: 'Customer creation failed' },
        });

        await expect(stripeService.ensureCustomer()).rejects.toThrow(
          'Failed to ensure customer'
        );
      });
    });
  });
});
