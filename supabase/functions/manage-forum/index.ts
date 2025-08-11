
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ForumAction {
  action: 'create-thread' | 'create-post' | 'delete-post' | 'report-post' | 'like-post' | 'toggle-comments' | 'pin-thread';
  classId?: string;
  threadId?: string;
  postId?: string;
  userId?: string;
  title?: string;
  content?: string;
  parentPostId?: string;
  commentsEnabled?: boolean;
  isPinned?: boolean;
  likeData?: { isLike: boolean };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ForumAction = await req.json();
    console.log('Forum action:', body);

    switch (body.action) {
      case 'create-thread': {
        if (!body.classId || !body.title || !body.content) {
          return new Response(JSON.stringify({ error: 'ClassId, title, and content are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('forum_threads')
          .insert({
            class_id: body.classId,
            author_id: user.id,
            title: body.title,
            content: body.content
          })
          .select()
          .single();

        if (error) {
          console.error('Create thread error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create-post': {
        if (!body.threadId || !body.content) {
          return new Response(JSON.stringify({ error: 'ThreadId and content are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Insert using existing schema (Dutch column names) for forum_posts
        const { data, error } = await supabase
          .from('forum_posts')
          .insert({
            thread_id: body.threadId,
            author_id: user.id,
            titel: 'Reactie',
            inhoud: body.content,
            parent_post_id: body.parentPostId || null,
            is_verwijderd: false
          })
          .select()
          .single();

        if (error) {
          console.error('Create post error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete-post': {
        if (!body.postId) {
          return new Response(JSON.stringify({ error: 'PostId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if user is admin/teacher or post author
        const { data: post } = await supabase
          .from('forum_posts')
          .select('author_id')
          .eq('id', body.postId)
          .single();

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!post || (post.author_id !== user.id && !['admin', 'leerkracht'].includes(profile?.role))) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Soft delete: mark as removed instead of hard delete
        const { error } = await supabase
          .from('forum_posts')
          .update({ is_verwijderd: true })
          .eq('id', body.postId);

        if (error) {
          console.error('Delete post error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'toggle-comments': {
        if (!body.threadId || body.commentsEnabled === undefined) {
          return new Response(JSON.stringify({ error: 'ThreadId and commentsEnabled are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('forum_threads')
          .update({ comments_enabled: body.commentsEnabled })
          .eq('id', body.threadId);

        if (error) {
          console.error('Toggle comments error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'pin-thread': {
        if (!body.threadId || body.isPinned === undefined) {
          return new Response(JSON.stringify({ error: 'ThreadId and isPinned are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('forum_threads')
          .update({ is_pinned: body.isPinned })
          .eq('id', body.threadId);

        if (error) {
          console.error('Pin thread error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'report-post': {
        if (!body.postId) {
          return new Response(JSON.stringify({ error: 'PostId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Mark post as reported
        const { error } = await supabase
          .from('forum_posts')
          .update({ is_gerapporteerd: true })
          .eq('id', body.postId);

        if (error) {
          console.error('Report post error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'approve-post': {
        if (!body.postId) {
          return new Response(JSON.stringify({ error: 'PostId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Clear report flag
        const { error } = await supabase
          .from('forum_posts')
          .update({ is_gerapporteerd: false })
          .eq('id', body.postId);

        if (error) {
          console.error('Approve post error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'like-post': {
        if (!body.postId || !body.userId || !body.likeData) {
          return new Response(JSON.stringify({ error: 'PostId, userId, and likeData are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Implementation for liking posts
        console.log('Post liked:', body.postId, 'by user:', body.userId, 'like:', body.likeData.isLike);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Manage forum function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
