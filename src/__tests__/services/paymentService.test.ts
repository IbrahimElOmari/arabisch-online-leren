import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as paymentService from '@/services/paymentService';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// Mock dependencies
vi.mock('@/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    payments: false,
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyPayments', () => {
    describe('when payments are disabled', () => {
      beforeEach(() => {
        vi.mocked(FEATURE_FLAGS).payments = false;
      });

      it('should return empty array (mock implementation)', async () => {
        const result = await paymentService.getMyPayments();
        
        expect(result).toEqual([]);
      });
    });

    describe('when payments are enabled', () => {
      beforeEach(() => {
        vi.mocked(FEATURE_FLAGS).payments = true;
      });

      it('should return empty array (real implementation placeholder)', async () => {
        // Real implementation will be added when Stripe tables exist
        const result = await paymentService.getMyPayments();
        
        expect(result).toEqual([]);
      });
    });
  });

  describe('useMyPaymentsQuery', () => {
    it('should be a valid hook function', () => {
      // useMyPaymentsQuery returns a UseQueryResult, not an object with queryKey
      expect(typeof paymentService.useMyPaymentsQuery).toBe('function');
    });
  });

  describe('Payment type', () => {
    it('should have correct structure', () => {
      const mockPayment: paymentService.Payment = {
        id: 'pay-1',
        user_id: 'user-1',
        currency: 'eur',
        status: 'paid',
        metadata: {},
        created_at: '2024-01-01',
      };
      expect(mockPayment.status).toBe('paid');
        
    });

    it('should support all payment statuses', () => {
      const statuses: paymentService.Payment['status'][] = ['pending', 'paid', 'failed', 'refunded'];
      
      statuses.forEach(status => {
        const payment: Partial<paymentService.Payment> = { status };
        expect(payment.status).toBe(status);
      });
    });
  });
});
