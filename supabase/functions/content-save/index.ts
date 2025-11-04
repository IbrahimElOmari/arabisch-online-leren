import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaveContentRequest {
  id?: string; // For updates
  content_type: string;
  title: string;
  content_data: any;
  status?: string;
  module_id?: string;
  level_id?: string;
  tags?: string[];
  metadata?: any;
  create_version?: boolean; // Create new version instead of updating
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
      throw new Error('Unauthorized: Only teachers and admins can save content');
    }

    const body: SaveContentRequest = await req.json();
    const { 
      id, 
      content_type, 
      title, 
      content_data, 
      status = 'draft', 
      module_id,
      level_id,
      tags = [],
      metadata = {},
      create_version = false
    } = body;

    if (!content_type || !title || !content_data) {
      throw new Error('Missing required fields: content_type, title, content_data');
    }

    let result;

    if (id && !create_version) {
      // Update existing content
      const { data, error } = await supabase
        .from('content_library')
        .update({
          title,
          content_data,
          status,
          module_id,
          level_id,
          tags,
          metadata,
          updated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log(`[CONTENT] Updated content ${id} by user ${user.id}`);

    } else if (id && create_version) {
      // Create new version
      const { data: currentVersion } = await supabase
        .from('content_library')
        .select('version')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('content_library')
        .insert({
          content_type,
          title,
          content_data,
          status: 'draft', // New versions start as draft
          module_id,
          level_id,
          tags,
          metadata,
          created_by: user.id,
          version: (currentVersion?.version || 1) + 1,
          parent_version_id: id
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log(`[CONTENT] Created new version of ${id} by user ${user.id}`);

    } else {
      // Create new content
      const { data, error } = await supabase
        .from('content_library')
        .insert({
          content_type,
          title,
          content_data,
          status,
          module_id,
          level_id,
          tags,
          metadata,
          created_by: user.id,
          version: 1
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log(`[CONTENT] Created new content by user ${user.id}`);
    }

    return new Response(
      JSON.stringify({
        message: 'Content saved successfully',
        content: result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Content save error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
