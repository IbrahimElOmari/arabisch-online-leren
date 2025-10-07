import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { taskId, taskTitle, levelId } = await req.json()

    if (!taskId || !taskTitle || !levelId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get class info for the level
    const { data: levelData, error: levelError } = await supabaseClient
      .from('niveaus')
      .select(`
        klassen:class_id (
          id,
          name
        )
      `)
      .eq('id', levelId)
      .single()

    if (levelError || !levelData) {
      console.error('Error fetching level data:', levelError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch level data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all students enrolled in this class
    const { data: enrollments, error: enrollmentError } = await supabaseClient
      .from('inschrijvingen')
      .select('student_id')
      .eq('class_id', levelData.klassen.id)
      .eq('payment_status', 'paid')

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch enrollments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notifications for all enrolled students
    const notifications = enrollments.map(enrollment => ({
      user_id: enrollment.student_id,
      message: `Nieuwe opdracht "${taskTitle}" is beschikbaar voor de klas "${levelData.klassen.name}".`
    }))

    if (notifications.length > 0) {
      const { error: notificationError } = await supabaseClient
        .from('user_notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
        return new Response(
          JSON.stringify({ error: 'Failed to create notifications' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true, notificationsCreated: notifications.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in notify-task-created function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})