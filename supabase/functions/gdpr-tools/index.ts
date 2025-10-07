import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if GDPR tools are enabled
    if (Deno.env.get('ENABLE_GDPR_TOOLS') !== 'true') {
      return new Response('GDPR tools disabled', { 
        status: 501, 
        headers: corsHeaders 
      });
    }

    // Verify JWT and get user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('Invalid token', { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').slice(-2).join('/'); // Get last two segments

    if (req.method === 'GET' && path === 'me/export') {
      // Export user's own data
      const userId = user.id;

      // Collect user data from various tables
      const [profile, enrollments, forumPosts, taskSubmissions, messages] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('inschrijvingen').select('*').eq('student_id', userId),
        supabase.from('forum_posts').select('*').eq('author_id', userId),
        supabase.from('task_submissions').select('*').eq('student_id', userId),
        supabase.from('direct_messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user_id: userId,
        profile: profile.data,
        enrollments: enrollments.data || [],
        forum_posts: forumPosts.data || [],
        task_submissions: taskSubmissions.data || [],
        messages: messages.data || [],
        // Note: This excludes sensitive data like payment info, audit logs, etc.
      };

      // Log the export action
      await supabase.rpc('log_audit_event', {
        p_action: 'gdpr_data_export',
        p_entity_type: 'profile',
        p_entity_id: userId,
        p_meta: { export_size: JSON.stringify(exportData).length }
      });

      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="user_data_${userId}_${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

    if (req.method === 'POST' && path === 'me/delete') {
      // Request account deletion (creates audit entry, doesn't actually delete)
      const userId = user.id;
      const body = await req.json();
      const reason = body.reason || 'User requested deletion';

      // Log deletion request
      await supabase.rpc('log_audit_event', {
        p_action: 'gdpr_deletion_request',
        p_entity_type: 'profile',
        p_entity_id: userId,
        p_meta: { reason, requested_at: new Date().toISOString() }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Deletion request has been logged. An administrator will process this request.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('GDPR tools error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});