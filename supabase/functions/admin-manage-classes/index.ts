import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error(`Authentication failed: ${userError?.message || 'No user found'}`);
    }

  // Verify admin role using secure RPC
  const { data: isAdmin, error: roleError } = await supabaseAdmin
    .rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

  if (roleError || !isAdmin) {
    throw new Error('Unauthorized: admin access required');
  }

    const { action, ...actionData } = await req.json();

    switch (action) {
      case 'create_class':
        // SECURITY: Input validation
        if (!actionData.name || typeof actionData.name !== 'string' || actionData.name.trim().length === 0) {
          throw new Error('Valid class name is required');
        }
        if (actionData.name.length > 100) {
          throw new Error('Class name too long (max 100 characters)');
        }
        if (actionData.description && actionData.description.length > 500) {
          throw new Error('Description too long (max 500 characters)');
        }

        const { data: newClass, error: createError } = await supabaseAdmin
          .from('klassen')
          .insert({
            name: actionData.name.trim(),
            description: actionData.description?.trim() || null,
            teacher_id: actionData.teacher_id || null
          })
          .select()
          .single();

        if (createError) throw createError;

        // Create default levels for the class
        const defaultLevels = [
          { naam: 'Niveau 1', niveau_nummer: 1, beschrijving: 'Basis Arabisch', class_id: newClass.id },
          { naam: 'Niveau 2', niveau_nummer: 2, beschrijving: 'Voortgezet Beginners', class_id: newClass.id },
          { naam: 'Niveau 3', niveau_nummer: 3, beschrijving: 'Intermediate', class_id: newClass.id },
          { naam: 'Niveau 4', niveau_nummer: 4, beschrijving: 'Gevorderd', class_id: newClass.id }
        ];

        await supabaseAdmin.from('niveaus').insert(defaultLevels);

        return new Response(JSON.stringify({ message: 'Class created successfully', class: newClass }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        });

      case 'assign_teacher':
        // SECURITY: Input validation
        if (!actionData.class_id || typeof actionData.class_id !== 'string') {
          throw new Error('Valid class_id is required');
        }
        if (!actionData.teacher_id || typeof actionData.teacher_id !== 'string') {
          throw new Error('Valid teacher_id is required');
        }

      // Verify teacher exists and has correct role using secure RPC
        const { data: isTeacher, error: teacherRoleError } = await supabaseAdmin
          .rpc('has_role', {
            _user_id: actionData.teacher_id,
            _role: 'leerkracht'
          });

        if (teacherRoleError || !isTeacher) {
          throw new Error('Invalid teacher: user must have leerkracht role');
        }

        const { data: updatedClass, error: assignError } = await supabaseAdmin
          .from('klassen')
          .update({ teacher_id: actionData.teacher_id })
          .eq('id', actionData.class_id)
          .select()
          .single();

        if (assignError) throw assignError;

        return new Response(JSON.stringify({ message: 'Teacher assigned successfully', class: updatedClass }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_users':
        const { data: users, error: usersError } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, role, email')
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        return new Response(JSON.stringify(users), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_teachers':
        const { data: teachers, error: teachersError } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'leerkracht')
          .order('full_name', { ascending: true });

        if (teachersError) throw teachersError;

        return new Response(JSON.stringify(teachers), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'update_user_role':
        // SECURITY: Prevent privilege escalation
        if (actionData.user_id === user.id) {
          throw new Error('Unauthorized: Cannot modify your own role');
        }

        // SECURITY: Validate role value
        const validRoles = ['admin', 'leerkracht', 'leerling'];
        if (!validRoles.includes(actionData.role)) {
          throw new Error('Invalid role specified');
        }

        // SECURITY: Only admins can promote users to admin role
        if (actionData.role === 'admin') {
          console.log(`SECURITY ALERT: Admin role promotion attempted for user ${actionData.user_id} by ${user.id}`);
        }

        // SECURITY: Input validation
        if (!actionData.user_id || typeof actionData.user_id !== 'string') {
          throw new Error('Invalid user_id provided');
        }

        const { data: updatedUser, error: roleError } = await supabaseAdmin
          .from('profiles')
          .update({ role: actionData.role })
          .eq('id', actionData.user_id)
          .select()
          .single();

        if (roleError) throw roleError;

        // Log security event
        await supabaseAdmin
          .from('audit_log')
          .insert({
            user_id: user.id,
            actie: 'admin_role_update',
            details: {
              target_user_id: actionData.user_id,
              new_role: actionData.role,
              timestamp: new Date().toISOString(),
              ip_address: req.headers.get('x-forwarded-for') || 'unknown'
            },
            severity: actionData.role === 'admin' ? 'critical' : 'high'
          });

        return new Response(JSON.stringify({ message: 'User role updated successfully', user: updatedUser }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Admin function error:', error.message);
    return new Response(
      JSON.stringify({ error: `Function failed: ${error.message}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Unauthorized') ? 403 : 500,
      }
    );
  }
});