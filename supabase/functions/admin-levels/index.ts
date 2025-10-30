import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const levelId = url.searchParams.get('id');
    const moduleId = url.searchParams.get('module_id');
    const method = req.method;

    // GET - List levels or single level
    if (method === 'GET') {
      if (levelId) {
        const { data, error } = await supabaseClient
          .from('module_levels')
          .select('*')
          .eq('id', levelId)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabaseClient.from('module_levels').select('*');
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      query = query.order('sequence_order');

      const { data, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create level
    if (method === 'POST') {
      const body = await req.json();
      const { module_id, level_code, level_name, sequence_order } = body;

      if (!module_id || !level_code || !level_name || sequence_order === undefined) {
        return new Response(
          JSON.stringify({ error: 'Invalid input: module_id, level_code, level_name, and sequence_order required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('module_levels')
        .insert({
          module_id,
          level_code,
          level_name,
          sequence_order,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Update level
    if (method === 'PUT') {
      if (!levelId) {
        return new Response(
          JSON.stringify({ error: 'Level ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const updates: Record<string, unknown> = {};
      
      if (body.level_code !== undefined) updates.level_code = body.level_code;
      if (body.level_name !== undefined) updates.level_name = body.level_name;
      if (body.sequence_order !== undefined) updates.sequence_order = body.sequence_order;

      const { data, error } = await supabaseClient
        .from('module_levels')
        .update(updates)
        .eq('id', levelId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete level
    if (method === 'DELETE') {
      if (!levelId) {
        return new Response(
          JSON.stringify({ error: 'Level ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('module_levels')
        .delete()
        .eq('id', levelId);

      if (error) throw error;

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
    console.error('Error in admin-levels:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});