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
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { class_id, niveau_id, titel, inhoud, body, media_url, media_type, thread_id } = await req.json();

    if (!class_id || !titel || (!inhoud && !body)) {
      throw new Error('Missing required fields: class_id, titel, inhoud/body');
    }

    console.log(`[FORUM-CREATE] Creating post in class ${class_id}`);

    // Verify user has access to this class
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('class_id', class_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!enrollment) {
      throw new Error('Access denied: not enrolled in this class');
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .insert({
        class_id,
        niveau_id,
        author_id: user.id,
        titel,
        inhoud: inhoud || body,
        body: body || inhoud,
        media_url,
        media_type,
        thread_id
      })
      .select(`
        *,
        profiles!forum_posts_author_id_fkey(full_name, role)
      `)
      .single();

    if (postError) {
      throw postError;
    }

    console.log(`[FORUM-CREATE] Post created: ${post.id}`);

    return new Response(
      JSON.stringify({ post }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    );

  } catch (error) {
    console.error('[FORUM-CREATE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 'FORUM_CREATE_ERROR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});