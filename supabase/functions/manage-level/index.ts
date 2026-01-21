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

interface LevelAction {
  action: 'create' | 'update' | 'delete';
  levelId?: string;
  classId?: string;
  name?: string;
  newName?: string;
  beschrijving?: string;
  niveauNummer?: number;
  isActief?: boolean;
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

    // Check if user is admin using secure has_role RPC
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      console.error('Role check failed:', roleError);
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: LevelAction = await req.json();
    console.log('Level action:', body);

    switch (body.action) {
      case 'create': {
        if (!body.classId || !body.name || body.niveauNummer === undefined) {
          return new Response(JSON.stringify({ error: 'ClassId, name, and niveauNummer are required for create action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('niveaus')
          .insert({
            class_id: body.classId,
            naam: body.name,
            beschrijving: body.beschrijving || null,
            niveau_nummer: body.niveauNummer,
            is_actief: body.isActief !== undefined ? body.isActief : true
          })
          .select()
          .single();

        if (error) {
          console.error('Create level error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        if (!body.levelId) {
          return new Response(JSON.stringify({ error: 'LevelId is required for update action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updateData: any = {};
        if (body.newName) updateData.naam = body.newName;
        if (body.beschrijving !== undefined) updateData.beschrijving = body.beschrijving;
        if (body.niveauNummer !== undefined) updateData.niveau_nummer = body.niveauNummer;
        if (body.isActief !== undefined) updateData.is_actief = body.isActief;

        if (Object.keys(updateData).length === 0) {
          return new Response(JSON.stringify({ error: 'At least one update field is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('niveaus')
          .update(updateData)
          .eq('id', body.levelId)
          .select()
          .single();

        if (error) {
          console.error('Update level error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!body.levelId) {
          return new Response(JSON.stringify({ error: 'LevelId is required for delete action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('niveaus')
          .delete()
          .eq('id', body.levelId);

        if (error) {
          console.error('Delete level error:', error);
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
    console.error('Manage level function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);