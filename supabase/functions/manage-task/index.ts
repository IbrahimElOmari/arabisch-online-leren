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

interface TaskAction {
  action: 'create-task' | 'submit-task' | 'grade-submission' | 'get-signed-url';
  level_id?: string;
  levelId?: string;
  task_id?: string;
  taskId?: string;
  submission_id?: string;
  submissionId?: string;
  title?: string;
  description?: string;
  required_submission_type?: 'text' | 'file';
  requiredSubmissionType?: 'text' | 'file';
  grading_scale?: number;
  gradingScale?: number;
  submission_content?: string;
  submissionContent?: string;
  submission_file_path?: string;
  submissionFilePath?: string;
  grade?: number;
  feedback?: string;
  file_name?: string;
  fileName?: string;
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

  // Get user role using secure RPC
  const { data: profile, error: profileError } = await supabase
    .rpc('get_user_role', {
      user_id: user.id
    });

  if (profileError) {
    console.error('Profile error:', profileError);
    return new Response(JSON.stringify({ error: 'User profile not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

    const body: TaskAction = await req.json();
    console.log('Task action:', body);

    switch (body.action) {
      case 'create-task': {
        const levelId = body.level_id || body.levelId;
        const submissionType = body.required_submission_type || body.requiredSubmissionType;
        const gradingScale = body.grading_scale || body.gradingScale;

        if (!levelId || !body.title || !submissionType || !gradingScale) {
          return new Response(JSON.stringify({ error: 'level_id, title, required_submission_type, and grading_scale are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      // Check authorization (admin or teacher of the level's class) using secure RPC
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!isAdmin) {
          const { data: levelCheck, error: levelError } = await supabase
            .from('niveaus')
            .select(`
              id,
              klassen!inner(teacher_id)
            `)
            .eq('id', levelId)
            .single();

          if (levelError || levelCheck.klassen?.teacher_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized to create tasks for this level' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      }

        const { data, error } = await supabase
          .from('tasks')
          .insert({
            level_id: levelId,
            author_id: user.id,
            title: body.title,
            description: body.description || null,
            required_submission_type: submissionType,
            grading_scale: gradingScale
          })
          .select()
          .single();

        if (error) {
          console.error('Create task error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Send notifications to students
        try {
          await supabase.functions.invoke('notify-task-created', {
            body: {
              taskId: data.id,
              taskTitle: body.title,
              levelId: levelId
            }
          });
        } catch (notificationError) {
          console.error('Failed to send notifications:', notificationError);
          // Don't fail the task creation if notifications fail
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'submit-task': {
        if (!body.taskId || (!body.submissionContent && !body.submissionFilePath)) {
          return new Response(JSON.stringify({ error: 'TaskId and either submissionContent or submissionFilePath are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if student has access to this task
        const { data: taskCheck, error: taskError } = await supabase
          .from('tasks')
          .select(`
            id,
            niveaus!inner(
              id,
              klassen!inner(
                id,
                inschrijvingen!inner(student_id, payment_status)
              )
            )
          `)
          .eq('id', body.taskId)
          .single();

        if (taskError) {
          return new Response(JSON.stringify({ error: 'Task not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const hasAccess = taskCheck.niveaus?.klassen?.inschrijvingen?.some(
          enrollment => enrollment.student_id === user.id && enrollment.payment_status === 'paid'
        );

        if (!hasAccess) {
          return new Response(JSON.stringify({ error: 'Unauthorized to submit to this task' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if submission already exists
        const { data: existingSubmission } = await supabase
          .from('task_submissions')
          .select('id')
          .eq('task_id', body.taskId)
          .eq('student_id', user.id)
          .single();

        if (existingSubmission) {
          return new Response(JSON.stringify({ error: 'You have already submitted this task' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('task_submissions')
          .insert({
            task_id: body.taskId,
            student_id: user.id,
            submission_content: body.submissionContent || null,
            submission_file_path: body.submissionFilePath || null
          })
          .select()
          .single();

        if (error) {
          console.error('Submit task error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'grade-submission': {
        if (!body.submissionId || (body.grade === undefined && !body.feedback)) {
          return new Response(JSON.stringify({ error: 'SubmissionId and either grade or feedback are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      // Check authorization (admin or teacher of the task's level's class) using secure RPC
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!isAdmin) {
          const { data: submissionCheck, error: submissionError } = await supabase
            .from('task_submissions')
            .select(`
              id,
              tasks!inner(
                id,
                niveaus!inner(
                  id,
                  klassen!inner(teacher_id)
                )
              )
            `)
            .eq('id', body.submissionId)
            .single();

          if (submissionError || submissionCheck.tasks?.niveaus?.klassen?.teacher_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized to grade this submission' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const updateData: any = {};
        if (body.grade !== undefined) updateData.grade = body.grade;
        if (body.feedback) updateData.feedback = body.feedback;

        const { data, error } = await supabase
          .from('task_submissions')
          .update(updateData)
          .eq('id', body.submissionId)
          .select()
          .single();

        if (error) {
          console.error('Grade submission error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-signed-url': {
        if (!body.fileName) {
          return new Response(JSON.stringify({ error: 'FileName is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const filePath = `tasks/${user.id}/${Date.now()}-${body.fileName}`;
        
        const { data, error } = await supabase.storage
          .from('media')
          .createSignedUploadUrl(filePath);

        if (error) {
          console.error('Signed URL error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          signedUrl: data.signedUrl,
          path: filePath
        }), {
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
    console.error('Manage task function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);