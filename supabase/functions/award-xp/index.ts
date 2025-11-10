// PR9: Award XP Edge Function
// Awards XP to students, handles level-ups, streak bonuses, and badge unlocking

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AwardXPRequest {
  student_id: string;
  xp_amount: number;
  activity_type: 'task_completed' | 'challenge_completed' | 'streak_bonus' | 'manual_award';
  context?: Record<string, any>;
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

    const body: AwardXPRequest = await req.json();
    const { student_id, xp_amount, activity_type, context = {} } = body;

    // Verify user is awarding XP to themselves or is admin
    if (user.id !== student_id) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!roleData || roleData.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Can only award XP to yourself' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get or create game profile
    let { data: profile, error: profileError } = await supabase
      .from('student_game_profiles')
      .select('*')
      .eq('student_id', student_id)
      .single();

    if (profileError || !profile) {
      // Create default profile based on user age (you'd get this from profiles table)
      const { data: userData } = await supabase
        .from('profiles')
        .select('birthdate')
        .eq('id', student_id)
        .single();

      const age = userData?.birthdate 
        ? new Date().getFullYear() - new Date(userData.birthdate).getFullYear()
        : 16;

      const gameMode = age <= 15 ? 'SPEELS' : 'PRESTIGE';

      const { data: newProfile, error: createError } = await supabase
        .from('student_game_profiles')
        .insert({
          student_id,
          game_mode: gameMode,
          xp_points: 0,
          level: 1,
          streak_days: 0
        })
        .select()
        .single();

      if (createError || !newProfile) {
        console.error('Failed to create profile:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create game profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      profile = newProfile;
    }

    // Calculate new XP and level
    const oldXP = profile.xp_points;
    const oldLevel = profile.level;
    const newXP = oldXP + xp_amount;

    // Level calculation: 100 XP per level (simple formula)
    const newLevel = Math.floor(newXP / 100) + 1;
    const leveledUp = newLevel > oldLevel;

    // Update streak if activity_type is task_completed
    let streakUpdate = {};
    if (activity_type === 'task_completed') {
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = profile.last_activity_date?.split('T')[0];
      
      if (lastActivity !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastActivity === yesterdayStr) {
          // Streak continues
          streakUpdate = { streak_days: profile.streak_days + 1 };
        } else {
          // Streak broken
          streakUpdate = { streak_days: 1 };
        }
        
        streakUpdate = { ...streakUpdate, last_activity_date: new Date().toISOString() };
      }
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('student_game_profiles')
      .update({
        xp_points: newXP,
        level: newLevel,
        ...streakUpdate
      })
      .eq('student_id', student_id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update game profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log XP activity
    await supabase
      .from('xp_activities')
      .insert({
        student_id,
        activity_type,
        xp_earned: xp_amount,
        context
      });

    // Check for badge unlocks
    const { data: badges } = await supabase
      .from('badges')
      .select('*')
      .or(`game_mode.eq.${profile.game_mode},game_mode.eq.BOTH`)
      .lte('xp_requirement', newXP);

    const badgesUnlocked = [];
    if (badges && badges.length > 0) {
      for (const badge of badges) {
        // Check if already earned
        const { data: existingBadge } = await supabase
          .from('student_badges')
          .select('id')
          .eq('student_id', student_id)
          .eq('badge_id', badge.id)
          .single();

        if (!existingBadge) {
          // Award badge
          const { error: badgeError } = await supabase
            .from('student_badges')
            .insert({
              student_id,
              badge_id: badge.id
            });

          if (!badgeError) {
            badgesUnlocked.push(badge);
          }
        }
      }
    }

    console.log(`Awarded ${xp_amount} XP to ${student_id}. Level: ${oldLevel} -> ${newLevel}`);

    return new Response(
      JSON.stringify({
        success: true,
        xp_awarded: xp_amount,
        old_xp: oldXP,
        new_xp: newXP,
        old_level: oldLevel,
        new_level: newLevel,
        level_up: leveledUp,
        badges_unlocked: badgesUnlocked,
        streak_days: streakUpdate['streak_days'] || profile.streak_days,
        message: leveledUp 
          ? `Level Up! You're now level ${newLevel}!`
          : `+${xp_amount} XP earned!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in award-xp:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
