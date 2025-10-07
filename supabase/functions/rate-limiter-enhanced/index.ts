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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { identifier, action_type, ip_address, user_agent } = await req.json()

    // Get client IP if not provided
    const clientIP = ip_address || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const clientUA = user_agent || req.headers.get('user-agent') || 'unknown'

    // Check rate limit using the database function
    const { data: allowed, error } = await supabaseClient
      .rpc('check_rate_limit', {
        p_identifier: identifier,
        p_action_type: action_type,
        p_max_attempts: getMaxAttempts(action_type),
        p_window_minutes: getWindowMinutes(action_type)
      })

    if (error) {
      throw new Error(`Rate limit check failed: ${error.message}`)
    }

    // Log security event if blocked
    if (!allowed) {
      await supabaseClient.functions.invoke('security-monitoring', {
        body: {
          action: 'log_security_event',
          type: 'suspicious_login',
          severity: 'medium',
          details: {
            identifier,
            action_type,
            ip_address: clientIP,
            user_agent: clientUA,
            blocked: true
          },
          ip_address: clientIP,
          user_agent: clientUA
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        allowed,
        message: allowed ? 'Request allowed' : 'Rate limit exceeded',
        retry_after: allowed ? null : 3600 // 1 hour in seconds
      }),
      { 
        status: allowed ? 200 : 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Rate limiter error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getMaxAttempts(actionType: string): number {
  const limits = {
    'login': 5,
    'signup': 3,
    'password_reset': 3,
    'forum_post': 10,
    'admin_action': 20
  }
  return limits[actionType as keyof typeof limits] || 5
}

function getWindowMinutes(actionType: string): number {
  const windows = {
    'login': 15,
    'signup': 60,
    'password_reset': 60,
    'forum_post': 5,
    'admin_action': 15
  }
  return windows[actionType as keyof typeof windows] || 15
}