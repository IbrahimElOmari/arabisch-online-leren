import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

Deno.serve(async (req) => {
  const startTime = performance.now();
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for health check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { 'x-client-info': 'health-check' },
      },
    });

    // Perform lightweight DB ping with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const dbCheckStart = performance.now();
    const { error } = await supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' })
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeout);
    const dbCheckDuration = performance.now() - dbCheckStart;

    if (error) {
      console.error('Health check DB error:', error);
      
      const totalDuration = performance.now() - startTime;
      return new Response(
        JSON.stringify({
          status: 'degraded',
          timestamp: new Date().toISOString(),
          checks: {
            database: { status: 'down', error: error.message, duration_ms: dbCheckDuration },
          },
          duration_ms: totalDuration,
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Server-Timing': `total;dur=${totalDuration}, db;dur=${dbCheckDuration}`,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    const totalDuration = performance.now() - startTime;

    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'ok', duration_ms: dbCheckDuration },
        },
        duration_ms: totalDuration,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Server-Timing': `total;dur=${totalDuration}, db;dur=${dbCheckDuration}`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    const totalDuration = performance.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    console.error('Health check error:', errorMessage);

    return new Response(
      JSON.stringify({
        status: 'down',
        timestamp: new Date().toISOString(),
        error: errorMessage,
        duration_ms: totalDuration,
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Server-Timing': `total;dur=${totalDuration}`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
});
