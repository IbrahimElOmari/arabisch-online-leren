// PR9: Complete Challenge Edge Function
// Marks a challenge as completed and awards XP

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteChallengeRequest {
  student_id: string;
  challenge_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CompleteChallengeRequest = await req.json();
    const { student_id, challenge_id } = body;

    // Verify user is completing their own challenge or is admin
    if (user.id !== student_id) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!roleData || roleData.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Can only complete your own challenges' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challenge_id)
      .eq('is_active', true)
      .single();

    if (challengeError || !challenge) {
      return new Response(
        JSON.stringify({ error: 'Challenge not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if challenge is still valid
    const now = new Date();
    const validFrom = new Date(challenge.valid_from);
    const validUntil = new Date(challenge.valid_until);

    if (now < validFrom || now > validUntil) {
      return new Response(
        JSON.stringify({ error: 'Challenge is not currently valid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already completed
    const { data: existingCompletion } = await supabase
      .from('student_challenges')
      .select('*')
      .eq('student_id', student_id)
      .eq('challenge_id', challenge_id)
      .single();

    if (existingCompletion?.is_completed) {
      return new Response(
        JSON.stringify({ error: 'Challenge already completed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark challenge as completed
    const { error: updateError } = await supabase
      .from('student_challenges')
      .upsert({
        student_id,
        challenge_id,
        is_completed: true,
        completed_at: new Date().toISOString(),
        xp_earned: challenge.xp_reward,
        progress: { completed: true }
      })
      .eq('student_id', student_id)
      .eq('challenge_id', challenge_id);

    if (updateError) {
      console.error('Failed to complete challenge:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to complete challenge' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Award XP via award-xp function
    const awardResponse = await supabase.functions.invoke('award-xp', {
      body: {
        student_id,
        xp_amount: challenge.xp_reward,
        activity_type: 'challenge_completed',
        context: {
          challenge_id,
          challenge_title: challenge.title,
          challenge_type: challenge.challenge_type
        }
      }
    });

    console.log(`Challenge ${challenge_id} completed by ${student_id}. XP: ${challenge.xp_reward}`);

    return new Response(
      JSON.stringify({
        success: true,
        challenge_completed: true,
        xp_earned: challenge.xp_reward,
        challenge_title: challenge.title,
        award_details: awardResponse.data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in complete-challenge:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
