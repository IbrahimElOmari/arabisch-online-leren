import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  check_type: 'api_health' | 'db_health' | 'edge_health' | 'storage_health';
  status: 'healthy' | 'degraded' | 'down';
  response_time_ms: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results: HealthCheckResult[] = [];

    // 1. DB Health Check
    const dbStart = Date.now();
    try {
      await supabaseClient.from('profiles').select('id').limit(1);
      results.push({
        check_type: 'db_health',
        status: 'healthy',
        response_time_ms: Date.now() - dbStart
      });
    } catch (error) {
      results.push({
        check_type: 'db_health',
        status: 'down',
        response_time_ms: Date.now() - dbStart,
        error_message: error.message
      });
    }

    // 2. API Health Check (self-check)
    const apiStart = Date.now();
    results.push({
      check_type: 'api_health',
      status: 'healthy',
      response_time_ms: Date.now() - apiStart
    });

    // 3. Storage Health Check
    const storageStart = Date.now();
    try {
      const { data: buckets } = await supabaseClient.storage.listBuckets();
      results.push({
        check_type: 'storage_health',
        status: buckets ? 'healthy' : 'degraded',
        response_time_ms: Date.now() - storageStart,
        metadata: { bucket_count: buckets?.length || 0 }
      });
    } catch (error) {
      results.push({
        check_type: 'storage_health',
        status: 'down',
        response_time_ms: Date.now() - storageStart,
        error_message: error.message
      });
    }

    // 4. Edge Functions Health (meta check)
    results.push({
      check_type: 'edge_health',
      status: 'healthy',
      response_time_ms: 0,
      metadata: { note: 'Self-reported as healthy' }
    });

    // Insert health checks into database
    const { error: insertError } = await supabaseClient
      .from('system_health_checks')
      .insert(results.map(r => ({
        ...r,
        check_timestamp: new Date().toISOString()
      })));

    if (insertError) {
      console.error('Failed to insert health checks:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        checks: results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
