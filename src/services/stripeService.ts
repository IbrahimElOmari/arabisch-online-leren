import { FEATURE_FLAGS } from '@/config/featureFlags';
import { supabase } from '@/integrations/supabase/client';

export type CheckoutParams = {
  mode: 'payment' | 'subscription';
  classId?: string;
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export type CheckoutResponse = {
  url: string;
};

export type PortalResponse = {
  url: string;
};

// Public API - used throughout the app
export async function createCheckoutSession(params: CheckoutParams): Promise<CheckoutResponse> {
  if (!FEATURE_FLAGS.payments) {
    return mockCreateCheckoutSession(params);
  }
  return realCreateCheckoutSession(params);
}

export async function createPortalSession(): Promise<PortalResponse> {
  if (!FEATURE_FLAGS.payments) {
    return mockCreatePortalSession();
  }
  return realCreatePortalSession();
}

export async function ensureCustomer(): Promise<void> {
  if (!FEATURE_FLAGS.payments) {
    return; // No-op in mock mode
  }
  return realEnsureCustomer();
}

// Mock implementations (no external traffic)
async function mockCreateCheckoutSession(_: CheckoutParams): Promise<CheckoutResponse> {
  return { url: '/billing/coming-soon' };
}

async function mockCreatePortalSession(): Promise<PortalResponse> {
  return { url: '/billing/coming-soon' };
}

// Real implementations (only execute when ENABLE_PAYMENTS=true)
async function realCreateCheckoutSession(params: CheckoutParams): Promise<CheckoutResponse> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: params
  });

  if (error) {
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }

  return data;
}

async function realCreatePortalSession(): Promise<PortalResponse> {
  const { data, error } = await supabase.functions.invoke('create-portal-session');

  if (error) {
    throw new Error(`Failed to create portal session: ${error.message}`);
  }

  return data;
}

async function realEnsureCustomer(): Promise<void> {
  const { error } = await supabase.functions.invoke('ensure-stripe-customer');

  if (error) {
    throw new Error(`Failed to ensure customer: ${error.message}`);
  }
}