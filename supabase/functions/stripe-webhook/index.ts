import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Early guard: check if payments are enabled
  if (!Deno.env.get('ENABLE_PAYMENTS') || Deno.env.get('ENABLE_PAYMENTS') !== 'true') {
    return new Response(
      JSON.stringify({ error: 'Payments are disabled' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 501 
      }
    );
  }

  try {
    // Placeholder for future Stripe webhook implementation
    const body = await req.text();
    
    console.log('Stripe webhook received:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      body: body.slice(0, 200) + '...' // Log first 200 chars
    });

    // TODO: Implement actual Stripe webhook logic
    // - Verify webhook signature
    // - Handle different webhook events (payment_intent.succeeded, etc.)
    // - Update payment status in database
    // - Send confirmation emails

    return new Response(
      JSON.stringify({ 
        message: 'Webhook received successfully',
        status: 'placeholder_implementation'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});