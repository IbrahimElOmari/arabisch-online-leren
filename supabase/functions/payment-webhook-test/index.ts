import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  event: 'payment.success' | 'payment.failure';
  payment_id: string;
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

    // Parse request body
    const body: WebhookRequest = await req.json();
    const { event, payment_id } = body;

    // Validate input
    if (!event || !payment_id) {
      throw new Error('Missing required fields');
    }

    if (!['payment.success', 'payment.failure'].includes(event)) {
      throw new Error('Invalid event type');
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id, 
        enrollment_id, 
        payment_status,
        enrollments!inner(id, student_id, status)
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    // Verify payment belongs to user
    if (payment.enrollments.student_id !== user.id) {
      throw new Error('Unauthorized to modify this payment');
    }

    // Check if already processed
    if (payment.payment_status !== 'pending') {
      console.log(`[STUB] Payment ${payment_id} already processed: ${payment.payment_status}`);
      return new Response(
        JSON.stringify({ 
          message: 'Payment already processed',
          status: payment.payment_status 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const now = new Date().toISOString();

    if (event === 'payment.success') {
      // Update payment status
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          payment_status: 'success',
          completed_at: now
        })
        .eq('id', payment_id);

      if (updatePaymentError) {
        throw updatePaymentError;
      }

      // Update enrollment status to pending_placement
      const { error: updateEnrollmentError } = await supabase
        .from('enrollments')
        .update({
          status: 'pending_placement'
        })
        .eq('id', payment.enrollment_id);

      if (updateEnrollmentError) {
        throw updateEnrollmentError;
      }

      console.log(`[STUB] Payment ${payment_id} succeeded. Enrollment ${payment.enrollment_id} → pending_placement`);

      return new Response(
        JSON.stringify({ 
          message: 'Payment succeeded',
          payment_id,
          enrollment_id: payment.enrollment_id,
          next_step: 'placement_test'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } else {
      // event === 'payment.failure'
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          completed_at: now
        })
        .eq('id', payment_id);

      if (updatePaymentError) {
        throw updatePaymentError;
      }

      console.log(`[STUB] Payment ${payment_id} failed. Enrollment remains pending_payment`);

      return new Response(
        JSON.stringify({ 
          message: 'Payment failed',
          payment_id,
          enrollment_id: payment.enrollment_id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
