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
    const classId = url.searchParams.get('id');
    const moduleId = url.searchParams.get('module_id');
    const method = req.method;

    // GET - List classes or single class
    if (method === 'GET') {
      if (classId) {
        const { data, error } = await supabaseClient
          .from('module_classes')
          .select('*')
          .eq('id', classId)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabaseClient.from('module_classes').select('*');
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      query = query.order('class_name');

      const { data, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create class
    if (method === 'POST') {
      const body = await req.json();
      const { module_id, class_name, capacity, is_active } = body;

      if (!module_id || !class_name || !capacity || capacity < 1) {
        return new Response(
          JSON.stringify({ error: 'Invalid input: module_id, class_name, and capacity (>0) required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('module_classes')
        .insert({
          module_id,
          class_name,
          capacity,
          is_active: is_active ?? true,
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

    // PUT - Update class
    if (method === 'PUT') {
      if (!classId) {
        return new Response(
          JSON.stringify({ error: 'Class ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const updates: Record<string, unknown> = {};
      
      if (body.class_name !== undefined) updates.class_name = body.class_name;
      if (body.capacity !== undefined) {
        if (body.capacity < 1) {
          return new Response(
            JSON.stringify({ error: 'Capacity must be > 0' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        updates.capacity = body.capacity;
      }
      if (body.is_active !== undefined) updates.is_active = body.is_active;

      const { data, error } = await supabaseClient
        .from('module_classes')
        .update(updates)
        .eq('id', classId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete class
    if (method === 'DELETE') {
      if (!classId) {
        return new Response(
          JSON.stringify({ error: 'Class ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('module_classes')
        .delete()
        .eq('id', classId);

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
    console.error('Error in admin-classes:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});