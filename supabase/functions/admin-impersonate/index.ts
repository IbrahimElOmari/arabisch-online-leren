import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Set the auth header for the client
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    })

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    // Get target user ID from URL
    const url = new URL(req.url)
    const targetUserId = url.pathname.split('/').pop()

    if (!targetUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
      throw new Error('Invalid user ID format')
    }

    // Verify target user exists
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetProfile) {
      throw new Error('Target user not found')
    }

    // Generate time-limited session token
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Store impersonation session
    const { error: sessionError } = await supabaseAdmin
      .from('admin_impersonation_sessions')
      .insert({
        admin_id: user.id,
        target_user_id: targetUserId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      })

    if (sessionError) {
      console.error('Session storage error:', sessionError)
      throw new Error('Failed to create impersonation session')
    }

    // Generate magic link for target user
    const { data: magicLink, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetProfile.email || `${targetUserId}@temp.local`,
      options: {
        redirectTo: `${req.headers.get('origin')}/dashboard?impersonation=${sessionToken}`
      }
    })

    if (linkError || !magicLink) {
      throw new Error('Failed to generate impersonation link')
    }

    // Log the impersonation attempt
    await supabaseAdmin.from('audit_log').insert({
      user_id: user.id,
      actie: 'admin_impersonation',
      details: {
        target_user_id: targetUserId,
        target_user_name: targetProfile.full_name,
        target_user_role: targetProfile.role,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      },
      severity: 'high'
    })

    // Log security event
    await supabaseAdmin.from('security_events').insert({
      user_id: user.id,
      actie: 'admin_impersonation_started',
      severity: 'high',
      details: {
        target_user_id: targetUserId,
        session_token: sessionToken
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent'),
      event_category: 'admin_action'
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Impersonation session created successfully',
        target_user: {
          id: targetProfile.id,
          name: targetProfile.full_name,
          role: targetProfile.role
        },
        session_url: magicLink.properties?.action_link,
        expires_at: expiresAt.toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Impersonation error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: error.message?.includes('Unauthorized') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})