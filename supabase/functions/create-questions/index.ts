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
    const questionData = await req.json();
    const { niveau_id, vraag_tekst, vraag_type, opties, correct_antwoord, volgorde } = questionData;

    if (!niveau_id || !vraag_tekst || !vraag_type) {
      throw new Error('niveau_id, vraag_tekst, and vraag_type are required');
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

    // Create the question
    const insertData = {
      niveau_id,
      vraag_tekst,
      vraag_type,
      opties: opties || null,
      correct_antwoord: correct_antwoord || null,
      volgorde: volgorde || 1
    };

    console.log('Creating question with data:', insertData);

    const { data: newQuestion, error: insertError } = await supabaseAdmin
      .from('vragen')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database insertion failed: ${insertError.message}`);
    }

    console.log('Question created successfully:', newQuestion);

    return new Response(
      JSON.stringify({
        message: 'Question created successfully',
        question: newQuestion
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