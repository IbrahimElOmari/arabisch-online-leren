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
    const lessonData = await req.json();
    const { class_id, title, live_lesson_datetime, live_lesson_url, preparation_deadline } = lessonData;

    if (!class_id || !title || !live_lesson_datetime) {
      throw new Error('class_id, title, and live_lesson_datetime are required');
    }

    // Authorization check
    let isAuthorized = false;

    if (userRole === 'admin') {
      console.log('User is admin, authorization granted');
      isAuthorized = true;
    } else if (userRole === 'leerkracht') {
      console.log('User is teacher, checking ownership...');
      
      // Check if teacher owns the class
      const { data: klas, error: klasError } = await supabaseAdmin
        .from('klassen')
        .select('teacher_id')
        .eq('id', class_id)
        .single();
      
      if (klasError) {
        throw new Error(`Could not find class: ${klasError.message}`);
      }
      
      if (klas?.teacher_id === user.id) {
        console.log('Authorization granted: teacher owns the class');
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.warn(`Authorization denied for user ${user.id} on class ${class_id}`);
      throw new Error('Unauthorized: you do not have permission to perform this action');
    }

    // Create the lesson
    const insertData = {
      class_id,
      title,
      live_lesson_datetime,
      live_lesson_url: live_lesson_url || null,
      preparation_deadline: preparation_deadline || null
    };

    console.log('Creating lesson with data:', insertData);

    const { data: newLesson, error: insertError } = await supabaseAdmin
      .from('lessen')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database insertion failed: ${insertError.message}`);
    }

    console.log('Lesson created successfully:', newLesson);

    return new Response(
      JSON.stringify({
        message: 'Lesson scheduled successfully',
        lesson: newLesson
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