import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  enrollment_id: string;
  module_id: string;
  payment_type: 'one_time' | 'installment';
}

// Rate limiting storage (in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxAttempts = 3, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user from auth token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `checkout:${user.id}:${clientIp}`;
    
    if (!checkRateLimit(rateLimitKey, 3, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again in 1 minute.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { enrollment_id, module_id, payment_type } = body;

    // Validate input
    if (!enrollment_id || !module_id || !payment_type) {
      throw new Error('Missing required fields');
    }

    if (!['one_time', 'installment'].includes(payment_type)) {
      throw new Error('Invalid payment_type');
    }

    // Verify enrollment belongs to user and status is pending_payment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, student_id, status')
      .eq('id', enrollment_id)
      .eq('student_id', user.id)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found or unauthorized');
    }

    if (enrollment.status !== 'pending_payment') {
      throw new Error(`Invalid enrollment status: ${enrollment.status}`);
    }

    // Get module to determine amount
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, price_one_time_cents, installment_monthly_cents')
      .eq('id', module_id)
      .single();

    if (moduleError || !module) {
      throw new Error('Module not found');
    }

    // Calculate amount based on payment type
    const amount_cents = payment_type === 'one_time' 
      ? module.price_one_time_cents 
      : module.installment_monthly_cents;

    if (!amount_cents || amount_cents <= 0) {
      throw new Error('Invalid module pricing configuration');
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        enrollment_id,
        amount_cents,
        payment_type,
        payment_method: 'stub',
        payment_status: 'pending',
        transaction_id: `stub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          test_mode: true,
          module_id,
          user_id: user.id,
          created_via: 'checkout-test-edge-function'
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      throw new Error('Failed to create payment record');
    }

    console.log(`[STUB] Payment created: ${payment.id} for enrollment ${enrollment_id}`);

    // Return stub checkout URL
    const checkoutUrl = `/payment/test-checkout?payment_id=${payment.id}&enrollment_id=${enrollment_id}`;

    return new Response(
      JSON.stringify({ 
        url: checkoutUrl,
        payment_id: payment.id,
        test_mode: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
