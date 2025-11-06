// PR7: Admin Metrics Retrieval Edge Function
// Returns system metrics snapshot for admin dashboard

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recent metrics (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: metrics, error: metricsError } = await supabase
      .from('system_metrics')
      .select('*')
      .gte('metric_timestamp', twentyFourHoursAgo)
      .order('metric_timestamp', { ascending: false })
      .limit(1000);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch metrics' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate metrics by type
    const aggregated: Record<string, any> = {};
    
    for (const metric of metrics || []) {
      if (!aggregated[metric.metric_type]) {
        aggregated[metric.metric_type] = {
          type: metric.metric_type,
          unit: metric.metric_unit,
          current: metric.metric_value,
          min: metric.metric_value,
          max: metric.metric_value,
          avg: metric.metric_value,
          count: 1,
          values: [metric.metric_value],
        };
      } else {
        const agg = aggregated[metric.metric_type];
        agg.count++;
        agg.values.push(metric.metric_value);
        agg.min = Math.min(agg.min, metric.metric_value);
        agg.max = Math.max(agg.max, metric.metric_value);
        agg.avg = agg.values.reduce((a: number, b: number) => a + b, 0) / agg.count;
      }
    }

    console.log('Metrics retrieved:', Object.keys(aggregated).length, 'types');

    return new Response(
      JSON.stringify({
        metrics: aggregated,
        period: '24h',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-metrics-get:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
