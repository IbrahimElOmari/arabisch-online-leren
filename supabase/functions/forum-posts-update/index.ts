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

    const { post_id, inhoud, body } = await req.json();

    if (!post_id || (!inhoud && !body)) {
      throw new Error('Missing required fields: post_id, inhoud/body');
    }

    console.log(`[FORUM-UPDATE] Updating post ${post_id}`);

    // Update post (RLS will check ownership)
    const { data: post, error: updateError } = await supabase
      .from('forum_posts')
      .update({
        inhoud: inhoud || body,
        body: body || inhoud,
        updated_at: new Date().toISOString()
      })
      .eq('id', post_id)
      .eq('author_id', user.id)
      .select(`
        *,
        profiles!forum_posts_author_id_fkey(full_name, role)
      `)
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new Error('Post not found or access denied');
      }
      throw updateError;
    }

    console.log(`[FORUM-UPDATE] Post updated: ${post.id}`);

    return new Response(
      JSON.stringify({ post }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FORUM-UPDATE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 'FORUM_UPDATE_ERROR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});