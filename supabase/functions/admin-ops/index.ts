import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if admin operations are enabled
    if (Deno.env.get('ENABLE_ADMIN') !== 'true') {
      return new Response('Admin operations disabled', { 
        status: 501, 
        headers: corsHeaders 
      });
    }

    // Verify JWT and get user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('Invalid token', { status: 401, headers: corsHeaders });
    }

    // Check if user is admin using secure RBAC
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !hasAdminRole) {
      return new Response('Admin access required', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    if (req.method === 'POST' && path === 'maintenance') {
      const body = await req.json();
      const enabled = body.enabled ?? false;

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'maintenance_mode',
          value: { enabled },
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_action: 'maintenance_mode_toggle',
        p_entity_type: 'system_settings',
        p_meta: { enabled }
      });

      return new Response(JSON.stringify({ success: true, enabled }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST' && path === 'backup') {
      const body = await req.json();
      const note = body.note || '';

      const { data, error } = await supabase
        .from('backup_jobs')
        .insert({
          requested_by: user.id,
          note,
          status: 'queued'
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_action: 'backup_job_created',
        p_entity_type: 'backup_jobs',
        p_entity_id: data.id,
        p_meta: { note }
      });

      return new Response(JSON.stringify({ success: true, job: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'GET' && path === 'audit') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:actor_id (
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Admin ops error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});