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
    const moduleId = url.searchParams.get('id');
    const method = req.method;

    // GET - List all modules or single module
    if (method === 'GET') {
      if (moduleId) {
        const { data, error } = await supabaseClient
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create new module
    if (method === 'POST') {
      const body = await req.json();
      const { name, description, price_one_time_cents, installment_months, installment_monthly_cents, is_active } = body;

      // Validation
      if (!name || price_one_time_cents < 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid input: name required, prices must be >= 0' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('modules')
        .insert({
          name,
          description,
          price_one_time_cents,
          installment_months: installment_months || 0,
          installment_monthly_cents: installment_monthly_cents || 0,
          is_active: is_active ?? false,
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

    // PUT - Update module
    if (method === 'PUT') {
      if (!moduleId) {
        return new Response(
          JSON.stringify({ error: 'Module ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const updates: Record<string, unknown> = {};
      
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.price_one_time_cents !== undefined) {
        if (body.price_one_time_cents < 0) {
          return new Response(
            JSON.stringify({ error: 'Prices must be >= 0' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        updates.price_one_time_cents = body.price_one_time_cents;
      }
      if (body.installment_months !== undefined) updates.installment_months = body.installment_months;
      if (body.installment_monthly_cents !== undefined) updates.installment_monthly_cents = body.installment_monthly_cents;
      if (body.is_active !== undefined) updates.is_active = body.is_active;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseClient
        .from('modules')
        .update(updates)
        .eq('id', moduleId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete module
    if (method === 'DELETE') {
      if (!moduleId) {
        return new Response(
          JSON.stringify({ error: 'Module ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('modules')
        .delete()
        .eq('id', moduleId);

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
    console.error('Error in admin-modules:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});