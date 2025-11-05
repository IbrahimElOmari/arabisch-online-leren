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

    const { post_id } = await req.json();

    if (!post_id) {
      throw new Error('Missing required field: post_id');
    }

    console.log(`[FORUM-DELETE] Soft deleting post ${post_id}`);

    // Soft delete (RLS will check ownership)
    const { error: deleteError } = await supabase
      .from('forum_posts')
      .update({
        is_verwijderd: true,
        verwijderd_door: user.id,
        inhoud: '[Deze post is verwijderd]',
        body: '[Deze post is verwijderd]'
      })
      .eq('id', post_id)
      .eq('author_id', user.id);

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        throw new Error('Post not found or access denied');
      }
      throw deleteError;
    }

    console.log(`[FORUM-DELETE] Post soft deleted: ${post_id}`);

    return new Response(
      JSON.stringify({ message: 'Post deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FORUM-DELETE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 'FORUM_DELETE_ERROR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});