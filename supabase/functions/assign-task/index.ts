import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignTaskRequest {
  levelId: string;
  title: string;
  description?: string;
  dueDate?: string;
  requiredSubmissionType: 'text' | 'file' | 'both';
  gradingScale: number;
  contentId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('get_user_role', { user_id: user.id });
    
    if (roleError || (roleData !== 'leerkracht' && roleData !== 'admin')) {
      throw new Error('Only teachers can assign tasks');
    }

    const taskData: AssignTaskRequest = await req.json();

    // Validate required fields
    if (!taskData.levelId || !taskData.title || !taskData.requiredSubmissionType) {
      throw new Error('Missing required fields');
    }

    // Verify teacher has access to this level
    const { data: niveau, error: niveauError } = await supabaseClient
      .from('niveaus')
      .select('class_id, klassen!inner(teacher_id)')
      .eq('id', taskData.levelId)
      .single();

    if (niveauError || !niveau) {
      throw new Error('Level not found');
    }

    // Check if teacher owns this class
    const teacherOwnsClass = niveau.klassen?.teacher_id === user.id;
    const isAdmin = roleData === 'admin';

    if (!teacherOwnsClass && !isAdmin) {
      throw new Error('Not authorized for this level');
    }

    // Create the task
    const { data: task, error: taskError } = await supabaseClient
      .from('tasks')
      .insert({
        level_id: taskData.levelId,
        author_id: user.id,
        title: taskData.title,
        description: taskData.description || '',
        required_submission_type: taskData.requiredSubmissionType,
        grading_scale: taskData.gradingScale,
        status: 'published',
        due_date: taskData.dueDate || null,
      })
      .select()
      .single();

    if (taskError) {
      console.error('Task creation error:', taskError);
      throw taskError;
    }

    console.log(`✅ Task "${taskData.title}" created by teacher ${user.id} for level ${taskData.levelId}`);

    return new Response(
      JSON.stringify({ success: true, task }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error assigning task:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
