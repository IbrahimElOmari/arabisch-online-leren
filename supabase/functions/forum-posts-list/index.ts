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

    const url = new URL(req.url);
    const class_id = url.searchParams.get('class_id');
    const niveau_id = url.searchParams.get('niveau_id');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!class_id) {
      throw new Error('Missing required parameter: class_id');
    }

    console.log(`[FORUM-LIST] Fetching posts for class ${class_id}, niveau ${niveau_id || 'all'}`);

    // Build query
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        profiles!forum_posts_author_id_fkey(full_name, role),
        forum_likes(is_like, user_id)
      `, { count: 'exact' })
      .eq('class_id', class_id)
      .eq('is_verwijderd', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (niveau_id) {
      query = query.eq('niveau_id', niveau_id);
    }

    const { data: posts, error: postsError, count } = await query;

    if (postsError) {
      throw postsError;
    }

    // Calculate like/dislike counts
    const enrichedPosts = posts?.map(post => {
      const likes = post.forum_likes?.filter((l: any) => l.is_like).length || 0;
      const dislikes = post.forum_likes?.filter((l: any) => !l.is_like).length || 0;
      const userLiked = post.forum_likes?.find((l: any) => l.user_id === user.id)?.is_like;
      
      return {
        ...post,
        likes_count: likes,
        dislikes_count: dislikes,
        user_reaction: userLiked !== undefined ? (userLiked ? 'like' : 'dislike') : null,
        forum_likes: undefined // Remove raw data
      };
    });

    console.log(`[FORUM-LIST] Returned ${posts?.length || 0} posts`);

    return new Response(
      JSON.stringify({ 
        posts: enrichedPosts,
        total: count,
        limit,
        offset
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FORUM-LIST] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 'FORUM_LIST_ERROR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});