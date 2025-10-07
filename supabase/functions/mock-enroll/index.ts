import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get request body
    const { class_id, student_id } = await req.json();
    
    if (!class_id) {
      throw new Error('class_id is required');
    }

    // Check if admin or allow self-enrollment for students
    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const targetStudentId = student_id || user.id;

    if (adminProfile?.role === 'admin') {
      // Admin can enroll any student
      if (!student_id) {
        throw new Error('student_id is required for admin enrollment');
      }
    } else {
      // Students can only enroll themselves
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'leerling') {
        throw new Error('Only students can enroll in classes');
      }
    }

    // Check if class exists
    const { data: klas } = await supabaseClient
      .from('klassen')
      .select('id, name')
      .eq('id', class_id)
      .single();

    if (!klas) {
      throw new Error('Class not found');
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseClient
      .from('inschrijvingen')
      .select('id')
      .eq('student_id', targetStudentId)
      .eq('class_id', class_id)
      .single();

    if (existingEnrollment) {
      throw new Error('Already enrolled in this class');
    }

    // Mock enrollment with paid status
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('inschrijvingen')
      .insert({
        student_id: targetStudentId,
        class_id: class_id,
        payment_status: 'paid'
      })
      .select()
      .single();

    if (enrollmentError) throw enrollmentError;

    // Log action
    await supabaseClient
      .from('audit_log')
      .insert({
        user_id: user.id,
        actie: adminProfile?.role === 'admin' ? 'admin_enrollment' : 'mock_enrollment',
        details: { 
          class_id,
          class_name: klas.name,
          enrollment_id: enrollment.id,
          student_id: targetStudentId,
          enrolled_by: user.id,
          timestamp: new Date().toISOString()
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    return new Response(
      JSON.stringify({ 
        message: 'Successfully enrolled in class',
        enrollment: enrollment,
        class_name: klas.name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Mock enrollment error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});