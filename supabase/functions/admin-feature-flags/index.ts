// PR7: Admin Feature Flags Management Edge Function
// CRUD operations for feature flags

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

    const method = req.method;
    const body = method !== 'GET' ? await req.json() : {};

    // LIST feature flags
    if (method === 'GET') {
      const { data: flags, error: flagsError } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (flagsError) {
        console.error('Error fetching feature flags:', flagsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch feature flags' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ flags }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CREATE feature flag
    if (method === 'POST') {
      const { flag_key, flag_name, description, is_enabled, rollout_percentage, target_roles, target_user_ids, metadata } = body;

      if (!flag_key || !flag_name) {
        return new Response(
          JSON.stringify({ error: 'flag_key and flag_name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newFlag, error: createError } = await supabase
        .from('feature_flags')
        .insert({
          flag_key,
          flag_name,
          description,
          is_enabled: is_enabled ?? false,
          rollout_percentage: rollout_percentage ?? 0,
          target_roles: target_roles ?? [],
          target_user_ids: target_user_ids ?? [],
          metadata: metadata ?? {},
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating feature flag:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create feature flag' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_activity_type: 'feature_flag_change',
        p_target_entity_type: 'feature_flag',
        p_target_entity_id: newFlag.id,
        p_action_metadata: { action: 'create', flag_key },
      });

      console.log('Feature flag created:', flag_key);

      return new Response(
        JSON.stringify({ flag: newFlag }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // UPDATE feature flag
    if (method === 'PUT' || method === 'PATCH') {
      const { id, ...updates } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'id is required for updates' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: updatedFlag, error: updateError } = await supabase
        .from('feature_flags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating feature flag:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update feature flag' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_activity_type: 'feature_flag_change',
        p_target_entity_type: 'feature_flag',
        p_target_entity_id: id,
        p_action_metadata: { action: 'update', updates },
      });

      console.log('Feature flag updated:', id);

      return new Response(
        JSON.stringify({ flag: updatedFlag }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE feature flag
    if (method === 'DELETE') {
      const { id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'id is required for deletion' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting feature flag:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete feature flag' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_activity_type: 'feature_flag_change',
        p_target_entity_type: 'feature_flag',
        p_target_entity_id: id,
        p_action_metadata: { action: 'delete' },
      });

      console.log('Feature flag deleted:', id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-feature-flags:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
