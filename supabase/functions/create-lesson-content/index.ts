import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error(`Authentication failed: ${userError?.message || 'No user found'}`);
    }

    // Get user profile and role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Profile not found: ${profileError.message}`);
    }

    const userRole = profile.role;
    console.log(`Action performed by user ${user.id} with role: ${userRole}`);

    // Parse request body
    const contentData = await req.json();
    const { content_type, title, url, niveau_id, description } = contentData;

    if (!content_type || !title || !niveau_id) {
      throw new Error('content_type, title, and niveau_id are required');
    }

    // Authorization check
    let isAuthorized = false;

    if (userRole === 'admin') {
      console.log('User is admin, authorization granted');
      isAuthorized = true;
    } else if (userRole === 'leerkracht') {
      console.log('User is teacher, checking ownership...');
      
      // Check if teacher owns the class that contains this niveau
      const { data: niveau, error: niveauError } = await supabaseAdmin
        .from('niveaus')
        .select('klassen(teacher_id)')
        .eq('id', niveau_id)
        .single();
      
      if (niveauError) {
        throw new Error(`Could not find niveau: ${niveauError.message}`);
      }
      
      if (niveau?.klassen?.teacher_id === user.id) {
        console.log('Authorization granted: teacher owns the class');
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.warn(`Authorization denied for user ${user.id} on niveau ${niveau_id}`);
      throw new Error('Unauthorized: you do not have permission to perform this action');
    }

    // Create the content - using a simple table structure
    const insertData = {
      niveau_id,
      content_type,
      title,
      url: url || null,
      description: description || null,
      created_by: user.id
    };

    console.log('Creating content with data:', insertData);

    // For now, we'll store in a simple way that works with existing schema
    // You may need to adjust this based on your actual table structure
    const { data: newContent, error: insertError } = await supabaseAdmin
      .from('les_content')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database insertion failed: ${insertError.message}`);
    }

    console.log('Content created successfully:', newContent);

    return new Response(
      JSON.stringify({
        message: 'Content created successfully',
        content: newContent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    );

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: `Function failed: ${error.message}`,
        details: error.stack || 'No stack trace available'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Unauthorized') ? 403 : 500,
      }
    );
  }
});