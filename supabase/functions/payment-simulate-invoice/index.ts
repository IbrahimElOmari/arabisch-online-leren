import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimulateInvoiceRequest {
  enrollment_id: string;
  simulate_success?: boolean;
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
    const body: SimulateInvoiceRequest = await req.json();
    const { enrollment_id, simulate_success = true } = body;

    // Validate input
    if (!enrollment_id) {
      throw new Error('Missing enrollment_id');
    }

    // Get enrollment with module info
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id, 
        student_id, 
        module_id,
        payment_type,
        status,
        modules!inner(
          installment_monthly_cents,
          installment_months
        )
      `)
      .eq('id', enrollment_id)
      .eq('student_id', user.id)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found or unauthorized');
    }

    if (enrollment.payment_type !== 'installment') {
      throw new Error('Enrollment is not using installment payment');
    }

    const module = enrollment.modules;
    const monthlyAmount = module.installment_monthly_cents;
    const totalMonths = module.installment_months || 1;

    if (!monthlyAmount || monthlyAmount <= 0) {
      throw new Error('Invalid module installment pricing');
    }

    // Get existing payments for this enrollment
    const { data: existingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('enrollment_id', enrollment_id)
      .order('created_at', { ascending: true });

    if (paymentsError) {
      throw paymentsError;
    }

    const existingCount = existingPayments?.length || 0;
    const remainingMonths = Math.max(0, totalMonths - existingCount);

    if (remainingMonths === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'All installments already processed',
          total_months: totalMonths,
          processed: existingCount
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Create next installment payment
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const paymentStatus = simulate_success ? 'success' : 'failed';

    const { data: payment, error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        enrollment_id,
        amount_cents: monthlyAmount,
        payment_type: 'installment',
        payment_method: 'stub',
        payment_status: paymentStatus,
        transaction_id: `stub_invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        completed_at: simulate_success ? now.toISOString() : null,
        metadata: {
          test_mode: true,
          installment_number: existingCount + 1,
          total_installments: totalMonths,
          due_date: nextMonth.toISOString(),
          simulated: true
        }
      })
      .select()
      .single();

    if (paymentInsertError) {
      throw paymentInsertError;
    }

    console.log(`[STUB] Installment payment ${payment.id} simulated as ${paymentStatus}`);

    return new Response(
      JSON.stringify({ 
        message: `Installment payment ${simulate_success ? 'succeeded' : 'failed'}`,
        payment_id: payment.id,
        installment_number: existingCount + 1,
        total_installments: totalMonths,
        remaining_installments: remainingMonths - 1,
        amount_cents: monthlyAmount,
        status: paymentStatus
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Simulate invoice error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
