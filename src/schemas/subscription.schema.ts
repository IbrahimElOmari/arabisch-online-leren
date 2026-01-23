import { z } from 'zod';

// ============================================
// SUBSCRIPTION & PAYMENT SCHEMAS
// Billing & Subscription Validation
// ============================================

export const subscriptionPlanSchema = z.enum([
  'free',
  'basic',
  'premium',
  'school'
]);

export const subscriptionStatusSchema = z.enum([
  'active',
  'cancelled',
  'past_due',
  'trialing',
  'paused',
  'expired'
]);

export const paymentMethodSchema = z.enum([
  'ideal',
  'card',
  'bancontact',
  'sepa_debit',
  'paypal'
]);

export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  plan_type: subscriptionPlanSchema,
  stripe_subscription_id: z.string().optional().nullable(),
  stripe_customer_id: z.string().optional().nullable(),
  status: subscriptionStatusSchema,
  current_period_start: z.string().datetime(),
  current_period_end: z.string().datetime(),
  cancelled_at: z.string().datetime().optional().nullable(),
  cancel_at_period_end: z.boolean().default(false),
  trial_end: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export const paymentSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  enrollment_id: z.string().uuid().optional().nullable(),
  subscription_id: z.string().uuid().optional().nullable(),
  amount_cents: z.number().int().min(0),
  currency: z.string().default('EUR'),
  payment_method: paymentMethodSchema.optional().nullable(),
  payment_status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']),
  stripe_payment_intent_id: z.string().optional().nullable(),
  stripe_session_id: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  invoice_url: z.string().url().optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  created_at: z.string().datetime(),
  paid_at: z.string().datetime().optional().nullable(),
});

export const createSubscriptionSchema = z.object({
  plan_type: subscriptionPlanSchema,
  payment_method: paymentMethodSchema.optional(),
});

export const updateSubscriptionSchema = z.object({
  plan_type: subscriptionPlanSchema.optional(),
  cancel_at_period_end: z.boolean().optional(),
});

export const checkoutSessionSchema = z.object({
  plan_type: subscriptionPlanSchema,
  success_url: z.string().url(),
  cancel_url: z.string().url(),
  customer_email: z.string().email().optional(),
});

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  payment_id: z.string().uuid(),
  invoice_number: z.string(),
  customer_name: z.string(),
  customer_email: z.string().email(),
  customer_address: z.string().optional(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().min(1),
    unit_price_cents: z.number().int().min(0),
    total_cents: z.number().int().min(0),
  })),
  subtotal_cents: z.number().int().min(0),
  tax_rate: z.number().min(0).max(100).default(21),
  tax_cents: z.number().int().min(0),
  total_cents: z.number().int().min(0),
  currency: z.string().default('EUR'),
  issued_at: z.string().datetime(),
  due_date: z.string().datetime().optional(),
  paid_at: z.string().datetime().optional().nullable(),
});

// Price configuration
export const pricingConfig = {
  free: {
    price_cents: 0,
    price_yearly_cents: 0,
    features: ['Niveau 1 content', '50 vragen per week', 'Basis oefeningen'],
  },
  basic: {
    price_cents: 999,
    price_yearly_cents: 9999,
    features: ['Niveaus 1-3', 'Onbeperkte oefeningen', 'Voortgangsrapportage', 'Community forum'],
  },
  premium: {
    price_cents: 1999,
    price_yearly_cents: 19999,
    features: ['Alle 6 niveaus', 'Live lessen', 'Certificaten', 'Prioriteit support', 'Alles van Basic'],
  },
  school: {
    price_cents: 0, // Custom pricing
    price_yearly_cents: 0,
    features: ['Alle content', 'Bulk accounts', 'Docent dashboard', 'API toegang', 'Aangepaste branding'],
  },
} as const;

// Type exports
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
