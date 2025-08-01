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

interface EnrollmentAction {
  action: 'assign-student' | 'remove-student' | 'create-bulk-notification';
  studentId?: string;
  classId?: string;
  userIds?: string[];
  message?: string;
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      console.error('Profile error or not admin:', profileError, profile);
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: EnrollmentAction = await req.json();
    console.log('Enrollment action:', body);

    switch (body.action) {
      case 'assign-student': {
        if (!body.studentId || !body.classId) {
          return new Response(JSON.stringify({ error: 'StudentId and classId are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabase
          .from('inschrijvingen')
          .select('id')
          .eq('student_id', body.studentId)
          .eq('class_id', body.classId)
          .single();

        if (existingEnrollment) {
          return new Response(JSON.stringify({ error: 'Student is already enrolled in this class' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('inschrijvingen')
          .insert({
            student_id: body.studentId,
            class_id: body.classId,
            payment_status: 'paid' // Admin assignments are automatically paid
          })
          .select()
          .single();

        if (error) {
          console.error('Assign student error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Send notification to student
        await supabase
          .from('user_notifications')
          .insert({
            user_id: body.studentId,
            message: `Je bent toegewezen aan een nieuwe klas. Welkom!`
          });

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'remove-student': {
        if (!body.studentId || !body.classId) {
          return new Response(JSON.stringify({ error: 'StudentId and classId are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('inschrijvingen')
          .delete()
          .eq('student_id', body.studentId)
          .eq('class_id', body.classId);

        if (error) {
          console.error('Remove student error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Send notification to student
        await supabase
          .from('user_notifications')
          .insert({
            user_id: body.studentId,
            message: `Je bent uitgeschreven uit een klas.`
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create-bulk-notification': {
        if (!body.userIds || !body.message || body.userIds.length === 0) {
          return new Response(JSON.stringify({ error: 'UserIds array and message are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const notifications = body.userIds.map(userId => ({
          user_id: userId,
          message: body.message!
        }));

        const { data, error } = await supabase
          .from('user_notifications')
          .insert(notifications)
          .select();

        if (error) {
          console.error('Bulk notification error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, count: data.length }), {
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
    console.error('Manage enrollment function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);