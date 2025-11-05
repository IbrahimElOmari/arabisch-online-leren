import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignClassRequest {
  enrollment_id: string;
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

    const body: AssignClassRequest = await req.json();
    const { enrollment_id } = body;

    if (!enrollment_id) {
      throw new Error('Missing enrollment_id');
    }

    // Verify enrollment belongs to user and status is pending_class
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, student_id, module_id, level_id, class_id, status')
      .eq('id', enrollment_id)
      .eq('student_id', user.id)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found or unauthorized');
    }

    // Check if already assigned
    if (enrollment.class_id && enrollment.status === 'active') {
      console.log(`[ASSIGN] Enrollment ${enrollment_id} already has class ${enrollment.class_id}`);
      return new Response(
        JSON.stringify({
          message: 'Class already assigned',
          class_id: enrollment.class_id,
          status: 'active'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (enrollment.status !== 'pending_class') {
      throw new Error(`Invalid enrollment status: ${enrollment.status}. Expected pending_class.`);
    }

    if (!enrollment.level_id) {
      throw new Error('Enrollment has no assigned level. Complete placement test first.');
    }

    // Find available class for this module
    const { data: classes, error: classesError } = await supabase
      .from('module_classes')
      .select('id, class_name, capacity, current_enrollment')
      .eq('module_id', enrollment.module_id)
      .eq('is_active', true)
      .order('current_enrollment', { ascending: true });

    if (classesError) {
      console.error('Failed to fetch classes:', classesError);
      throw new Error('Failed to fetch available classes');
    }

    if (!classes || classes.length === 0) {
      throw new Error('No active classes available for this module');
    }

    // Find class with available capacity
    let assignedClass = null;
    for (const cls of classes) {
      const currentEnrollment = cls.current_enrollment || 0;
      if (currentEnrollment < cls.capacity) {
        assignedClass = cls;
        break;
      }
    }

    if (!assignedClass) {
      // No available class - add to waiting list
      console.log(`[ASSIGN] No capacity available for enrollment ${enrollment_id}, adding to waiting list`);
      
      // Check if already on waiting list
      const { data: existingWait } = await supabase
        .from('waiting_list')
        .select('id')
        .eq('enrollment_id', enrollment_id)
        .single();

      if (!existingWait) {
        // Get position in queue
        const { count } = await supabase
          .from('waiting_list')
          .select('*', { count: 'exact', head: true });

        const position = (count || 0) + 1;

        const { error: waitError } = await supabase
          .from('waiting_list')
          .insert({
            enrollment_id,
            position
          });

        if (waitError) {
          console.error('Failed to add to waiting list:', waitError);
          throw new Error('Failed to add to waiting list');
        }
      }

      return new Response(
        JSON.stringify({
          message: 'No available classes. Added to waiting list.',
          status: 'waiting',
          on_waiting_list: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Assign class
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        class_id: assignedClass.id,
        status: 'active',
        activated_at: now,
        last_activity: now
      })
      .eq('id', enrollment_id);

    if (updateError) {
      console.error('Failed to assign class:', updateError);
      throw new Error('Failed to assign class');
    }

    // Add student to forum_members for class forums
    const { data: forumRooms } = await supabase
      .from('forum_rooms')
      .select('id')
      .eq('module_id', enrollment.module_id)
      .eq('is_active', true);

    if (forumRooms && forumRooms.length > 0) {
      for (const room of forumRooms) {
        await supabase
          .from('forum_members')
          .insert({
            forum_room_id: room.id,
            user_id: user.id
          })
          .onConflict('forum_room_id,user_id')
          .ignoreDuplicates();
      }
    }

    // Audit logging
    await supabase.from('audit_log').insert({
      user_id: user.id,
      actie: 'CLASS_ASSIGNED',
      resource_type: 'enrollment',
      resource_id: enrollment_id,
      severity: 'info',
      details: { 
        enrollment_id, 
        class_id: assignedClass.id, 
        class_name: assignedClass.class_name 
      }
    });

    console.log(`[ASSIGN] Assigned enrollment ${enrollment_id} to class ${assignedClass.id}`);

    return new Response(
      JSON.stringify({
        message: 'Class assigned successfully',
        class_id: assignedClass.id,
        class_name: assignedClass.class_name,
        status: 'active'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Class assignment error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
