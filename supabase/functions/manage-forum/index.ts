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
  action: 'create-thread' | 'create-post' | 'delete-post' | 'toggle-comments' | 'pin-thread' | 'approve-post' | 'report-post' | 'like-post';
  classId?: string;
  threadId?: string;
  postId?: string;
  parentPostId?: string;
  title?: string;
  content?: string;
  commentsEnabled?: boolean;
  isPinned?: boolean;
  userId?: string;
  likeData?: { isLike: boolean };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
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

        // Check if user has permission to create threads in this class
        let hasPermission = false;
        
        if (profile.role === 'admin') {
          hasPermission = true;
        } else if (profile.role === 'leerkracht') {
          // Check if teacher is assigned to this class
          const { data: classData } = await supabase
            .from('klassen')
            .select('teacher_id')
            .eq('id', body.classId)
            .single();
          
          hasPermission = classData?.teacher_id === user.id;
        } else if (profile.role === 'leerling') {
          // Check if student is enrolled in this class
          const { data: enrollment } = await supabase
            .from('inschrijvingen')
            .select('id')
            .eq('student_id', user.id)
            .eq('class_id', body.classId)
            .eq('payment_status', 'paid')
            .single();
          
          hasPermission = !!enrollment;
        }

        if (!hasPermission) {
          return new Response(JSON.stringify({ error: 'Geen toestemming om een onderwerp te maken in deze klas' }), {
            status: 403,
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

        // Check if user has permission to post in this thread's class
        const { data: threadData, error: threadError } = await supabase
          .from('forum_threads')
          .select('class_id')
          .eq('id', body.threadId)
          .single();

        if (threadError || !threadData) {
          return new Response(JSON.stringify({ error: 'Thread niet gevonden' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let hasPermission = false;
        
        if (profile.role === 'admin') {
          hasPermission = true;
        } else if (profile.role === 'leerkracht') {
          // Check if teacher is assigned to this class
          const { data: classData } = await supabase
            .from('klassen')
            .select('teacher_id')
            .eq('id', threadData.class_id)
            .single();
          
          hasPermission = classData?.teacher_id === user.id;
        } else if (profile.role === 'leerling') {
          // Check if student is enrolled in this class
          const { data: enrollment } = await supabase
            .from('inschrijvingen')
            .select('id')
            .eq('student_id', user.id)
            .eq('class_id', threadData.class_id)
            .eq('payment_status', 'paid')
            .single();
          
          hasPermission = !!enrollment;
        }

        if (!hasPermission) {
          return new Response(JSON.stringify({ error: 'Geen toestemming om te reageren in dit forum' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('forum_posts')
          .insert({
            thread_id: body.threadId,
            author_id: user.id,
            parent_post_id: body.parentPostId || null,
            content: body.content
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

        // Check if user can delete (author, teacher of class, or admin)
        const { data: post, error: postError } = await supabase
          .from('forum_posts')
          .select(`
            *,
            thread_id,
            forum_threads!inner(class_id, klassen!inner(teacher_id))
          `)
          .eq('id', body.postId)
          .single();

        if (postError) {
          console.error('Post lookup error:', postError);
          return new Response(JSON.stringify({ error: 'Post not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const canDelete = post.author_id === user.id || 
                         profile.role === 'admin' || 
                         (post.forum_threads?.klassen?.teacher_id === user.id);

        if (!canDelete) {
          return new Response(JSON.stringify({ error: 'Unauthorized to delete this post' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('forum_posts')
          .delete()
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

        // Only admins can toggle comments
        if (profile.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('forum_threads')
          .update({ comments_enabled: body.commentsEnabled })
          .eq('id', body.threadId)
          .select()
          .single();

        if (error) {
          console.error('Toggle comments error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
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

        // Check if user can pin (teacher of class or admin)
        const { data: thread, error: threadError } = await supabase
          .from('forum_threads')
          .select(`
            *,
            klassen!inner(teacher_id)
          `)
          .eq('id', body.threadId)
          .single();

        if (threadError) {
          console.error('Thread lookup error:', threadError);
          return new Response(JSON.stringify({ error: 'Thread not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const canPin = profile.role === 'admin' || thread.klassen?.teacher_id === user.id;

        if (!canPin) {
          return new Response(JSON.stringify({ error: 'Unauthorized to pin this thread' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('forum_threads')
          .update({ is_pinned: body.isPinned })
          .eq('id', body.threadId)
          .select()
          .single();

        if (error) {
          console.error('Pin thread error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'approve-post': {
        if (!body.postId) {
          return new Response(JSON.stringify({ error: 'Post ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

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

      case 'report-post': {
        if (!body.postId) {
          return new Response(JSON.stringify({ error: 'Post ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

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

      case 'like-post': {
        if (!body.postId || !body.userId || !body.likeData) {
          return new Response(JSON.stringify({ error: 'PostId, userId, and likeData are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // First check if user already liked/disliked this post
        const { data: existingLike } = await supabase
          .from('forum_likes')
          .select('*')
          .eq('user_id', body.userId)
          .eq('post_id', body.postId)
          .maybeSingle();

        if (existingLike) {
          if (existingLike.is_like === body.likeData.isLike) {
            // Same action, remove like/dislike
            await supabase
              .from('forum_likes')
              .delete()
              .eq('id', existingLike.id);
          } else {
            // Different action, update
            await supabase
              .from('forum_likes')
              .update({ is_like: body.likeData.isLike })
              .eq('id', existingLike.id);
          }
        } else {
          // New like/dislike
          await supabase
            .from('forum_likes')
            .insert({
              user_id: body.userId,
              post_id: body.postId,
              is_like: body.likeData.isLike
            });
        }

        // Update post counts
        const { data: likeCounts } = await supabase
          .from('forum_likes')
          .select('is_like')
          .eq('post_id', body.postId);

        const likes = likeCounts?.filter(l => l.is_like).length || 0;
        const dislikes = likeCounts?.filter(l => !l.is_like).length || 0;

        const { error } = await supabase
          .from('forum_posts')
          .update({ 
            likes_count: likes,
            dislikes_count: dislikes
          })
          .eq('id', body.postId);

        if (error) {
          console.error('Update post counts error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

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