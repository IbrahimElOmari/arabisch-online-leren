import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  content_id: string;
  link_to_lesson?: {
    lesson_type: 'prep' | 'live';
    lesson_id: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is teacher or admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['leerkracht', 'admin'].includes(userRole.role)) {
      throw new Error('Unauthorized: Only teachers and admins can publish content');
    }

    const body: PublishRequest = await req.json();
    const { content_id, link_to_lesson } = body;

    if (!content_id) {
      throw new Error('Missing content_id');
    }

    // Update content status to published
    const { data: content, error: publishError } = await supabase
      .from('content_library')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', content_id)
      .select()
      .single();

    if (publishError) {
      console.error('Publish error:', publishError);
      throw new Error('Failed to publish content');
    }

    // Link to lesson if requested
    if (link_to_lesson) {
      const table = link_to_lesson.lesson_type === 'prep' ? 'prep_lessons' : 'live_lessons';
      const { error: linkError } = await supabase
        .from(table)
        .update({ content_id: content_id })
        .eq('id', link_to_lesson.lesson_id);

      if (linkError) {
        console.error('Link error:', linkError);
        // Don't throw - content is still published
      }
    }

    console.log(`[CONTENT] Published content ${content_id} by user ${user.id}`);

    return new Response(
      JSON.stringify({
        message: 'Content published successfully',
        content
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Content publish error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
