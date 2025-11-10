// PR9: Calculate Leaderboard Edge Function
// Recalculates leaderboard rankings for all students

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeaderboardRequest {
  leaderboard_type?: 'class' | 'global' | 'niveau';
  scope_id?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
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

    // Only admins can trigger leaderboard calculation
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: LeaderboardRequest = req.method === 'POST' ? await req.json() : {};
    const { 
      leaderboard_type = 'global',
      scope_id = null,
      period = 'all_time'
    } = body;

    // Get date range based on period
    let dateFilter = '';
    const now = new Date();
    
    if (period === 'daily') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = `AND sgp.updated_at >= '${today.toISOString()}'`;
    } else if (period === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = `AND sgp.updated_at >= '${weekAgo.toISOString()}'`;
    } else if (period === 'monthly') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND sgp.updated_at >= '${monthAgo.toISOString()}'`;
    }

    // Build query based on leaderboard type
    let scopeFilter = '';
    if (leaderboard_type === 'class' && scope_id) {
      scopeFilter = `
        JOIN enrollments e ON sgp.student_id = e.student_id
        WHERE e.class_id = '${scope_id}' AND e.status = 'active'
      `;
    } else if (leaderboard_type === 'niveau' && scope_id) {
      scopeFilter = `
        JOIN enrollments e ON sgp.student_id = e.student_id
        WHERE e.level_id = '${scope_id}' AND e.status = 'active'
      `;
    } else {
      scopeFilter = 'WHERE TRUE';
    }

    // Get all students with their XP
    const { data: students, error: studentsError } = await supabase
      .from('student_game_profiles')
      .select('student_id, xp_points')
      .order('xp_points', { ascending: false });

    if (studentsError) {
      console.error('Failed to fetch students:', studentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch student data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate rankings
    const rankings = students.map((student, index) => ({
      student_id: student.student_id,
      leaderboard_type,
      scope_id,
      period,
      xp_points: student.xp_points,
      rank: index + 1,
      calculated_at: new Date().toISOString()
    }));

    // Delete old rankings for this leaderboard
    await supabase
      .from('leaderboard_rankings')
      .delete()
      .eq('leaderboard_type', leaderboard_type)
      .eq('period', period)
      .match(scope_id ? { scope_id } : {});

    // Insert new rankings
    const { error: insertError } = await supabase
      .from('leaderboard_rankings')
      .insert(rankings);

    if (insertError) {
      console.error('Failed to insert rankings:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to update leaderboard' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Leaderboard calculated: ${leaderboard_type}/${period}. ${rankings.length} entries.`);

    return new Response(
      JSON.stringify({
        success: true,
        leaderboard_type,
        period,
        scope_id,
        rankings_updated: rankings.length,
        top_3: rankings.slice(0, 3)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-leaderboard:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
