import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Payment } from '@/types/modules';
import { z } from 'zod';

// Validation schemas
export const createCheckoutSchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
  moduleId: z.string().uuid('Invalid module ID'),
  amountCents: z.number().min(0).max(1000000),
  paymentType: z.enum(['one_time', 'installment']),
});

export const paymentIdSchema = z.string().uuid('Invalid payment ID');

/**
 * Payment Service (STUB MODE)
 * 
 * This is a STUB implementation that simulates payment processing.
 * Replace with real Stripe integration when ready by:
 * 1. Setting ENABLE_STRIPE_LIVE=true in feature flags
 * 2. Adding STRIPE_SECRET_KEY to secrets
 * 3. Implementing real Stripe checkout in Edge Functions
 */

export const paymentService = {
  /**
   * Create a test payment checkout session (STUB)
   * In production, this would redirect to Stripe checkout
   */
  async createCheckoutSession(enrollmentId: string, moduleId: string, amountCents: number, paymentType: 'one_time' | 'installment'): Promise<{ url: string; payment_id: string }> {
    try {
      // Validate inputs
      const validated = createCheckoutSchema.parse({ enrollmentId, moduleId, amountCents, paymentType });
      // Create payment record
      const payment: Omit<Payment, 'id' | 'created_at' | 'completed_at'> = {
        enrollment_id: validated.enrollmentId,
        amount_cents: validated.amountCents,
        payment_type: validated.paymentType,
        payment_method: 'stub',
        payment_status: 'pending',
        transaction_id: `stub_${Date.now()}`,
        metadata: {
          test_mode: true,
          module_id: moduleId
        }
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;

      logger.info('Stub payment created', { paymentId: data.id, enrollmentId });

      // Return stub checkout URL
      return {
        url: `/payment/test-checkout?payment_id=${data.id}&enrollment_id=${enrollmentId}`,
        payment_id: data.id
      };
    } catch (error) {
      logger.error('Failed to create checkout session', { enrollmentId }, error as Error);
      throw error;
    }
  },

  /**
   * Simulate payment success (STUB)
   */
  async simulatePaymentSuccess(paymentId: string): Promise<Payment> {
    try {
      // Validate input
      paymentIdSchema.parse(paymentId);
      const { data, error } = await supabase
        .from('payments')
        .update({
          payment_status: 'success',
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      
      const payment: Payment = {
        ...data,
        metadata: (data.metadata as Record<string, any>) || {}
      };

      // Update enrollment status to pending_placement
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .update({ status: 'pending_placement' })
        .eq('id', data.enrollment_id);

      if (enrollmentError) throw enrollmentError;

      logger.info('Payment succeeded (stub)', { paymentId });
      return payment;
    } catch (error) {
      logger.error('Failed to simulate payment success', { paymentId }, error as Error);
      throw error;
    }
  },

  /**
   * Simulate payment failure (STUB)
   */
  async simulatePaymentFailure(paymentId: string): Promise<Payment> {
    try {
      // Validate input
      paymentIdSchema.parse(paymentId);
      const { data, error } = await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      
      const payment: Payment = {
        ...data,
        metadata: (data.metadata as Record<string, any>) || {}
      };
      
      logger.warn('Payment failed (stub)', { paymentId });
      return payment;
    } catch (error) {
      logger.error('Failed to simulate payment failure', { paymentId }, error as Error);
      throw error;
    }
  },

  async getPaymentsByEnrollment(enrollmentId: string): Promise<Payment[]> {
    try {
      // Validate input
      z.string().uuid().parse(enrollmentId);
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const payments: Payment[] = (data || []).map(p => ({
        ...p,
        metadata: (p.metadata as Record<string, any>) || {}
      }));
      
      return payments;
    } catch (error) {
      logger.error('Failed to fetch payments', { enrollmentId }, error as Error);
      throw error;
    }
  }
};
