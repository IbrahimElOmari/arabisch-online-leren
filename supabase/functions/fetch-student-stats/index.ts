import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      throw new Error('Only teachers can fetch student stats');
    }

    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    const classId = url.searchParams.get('classId');

    if (!studentId && !classId) {
      throw new Error('Student ID or Class ID required');
    }

    let stats: any = {};

    if (studentId) {
      // Fetch individual student stats
      const [profileData, progressData, submissionsData] = await Promise.all([
        supabaseClient
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('id', studentId)
          .single(),
        supabaseClient
          .from('student_niveau_progress')
          .select('*')
          .eq('student_id', studentId),
        supabaseClient
          .from('task_submissions')
          .select('id, grade, submitted_at')
          .eq('student_id', studentId)
          .order('submitted_at', { ascending: false })
          .limit(10),
      ]);

      stats = {
        profile: profileData.data,
        progress: progressData.data,
        recentSubmissions: submissionsData.data,
        totalSubmissions: submissionsData.data?.length || 0,
        averageGrade: submissionsData.data?.reduce((sum, s) => sum + (s.grade || 0), 0) / (submissionsData.data?.length || 1),
      };
    } else if (classId) {
      // Fetch class-wide stats
      const { data: enrollments, error: enrollError } = await supabaseClient
        .from('inschrijvingen')
        .select(`
          student_id,
          profiles!inschrijvingen_student_id_fkey(id, full_name, email)
        `)
        .eq('class_id', classId)
        .eq('payment_status', 'paid');

      if (enrollError) throw enrollError;

      stats = {
        totalStudents: enrollments?.length || 0,
        students: enrollments,
      };
    }

    console.log(`📊 Fetched stats for ${studentId ? 'student' : 'class'} by teacher ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching student stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
