import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AwardXPRequest {
  studentId: string;
  amount: number;
  reason: string;
  rewardType?: 'points' | 'badge' | 'coins';
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

    // Verify teacher role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('get_user_role', { user_id: user.id });
    
    if (roleError || (roleData !== 'leerkracht' && roleData !== 'admin')) {
      throw new Error('Only teachers can award XP');
    }

    const { studentId, amount, reason, rewardType = 'points' }: AwardXPRequest = await req.json();

    // Validate input
    if (!studentId || amount <= 0) {
      throw new Error('Invalid student ID or amount');
    }

    // Record the reward
    const { data: reward, error: rewardError } = await supabaseClient
      .from('teacher_rewards')
      .insert({
        teacher_id: user.id,
        student_id: studentId,
        reward_type: rewardType,
        reward_value: amount,
        reason: reason || 'Manual award',
      })
      .select()
      .single();

    if (rewardError) {
      console.error('Reward insert error:', rewardError);
      throw rewardError;
    }

    // Update student XP (if applicable)
    if (rewardType === 'points') {
      const { error: xpError } = await supabaseClient.rpc('add_student_xp', {
        p_student_id: studentId,
        p_amount: amount,
      });

      if (xpError) {
        console.warn('XP update warning:', xpError);
      }
    }

    console.log(`✅ Awarded ${amount} ${rewardType} to student ${studentId} by teacher ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, reward }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error awarding XP:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
