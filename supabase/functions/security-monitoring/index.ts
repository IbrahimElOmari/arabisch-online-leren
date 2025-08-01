import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityAlert {
  type: 'privilege_escalation' | 'suspicious_login' | 'mass_deletion' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()

    switch (action) {
      case 'log_security_event':
        return await logSecurityEvent(supabaseClient, params as SecurityAlert)
      
      case 'check_suspicious_activity':
        return await checkSuspiciousActivity(supabaseClient, params)
      
      case 'get_security_events':
        return await getSecurityEvents(supabaseClient, params)
      
      case 'cleanup_sessions':
        return await cleanupExpiredSessions(supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Security monitoring error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function logSecurityEvent(supabaseClient: any, alert: SecurityAlert) {
  console.log('Logging security event:', alert)
  
  // Insert into audit log
  const { error } = await supabaseClient
    .from('audit_log')
    .insert({
      user_id: alert.user_id || '00000000-0000-0000-0000-000000000000',
      actie: alert.type,
      severity: alert.severity,
      details: alert.details,
      ip_address: alert.ip_address,
      user_agent: alert.user_agent
    })

  if (error) {
    throw new Error(`Failed to log security event: ${error.message}`)
  }

  // Check if this is a critical event that needs immediate attention
  if (alert.severity === 'critical') {
    await handleCriticalAlert(supabaseClient, alert)
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCriticalAlert(supabaseClient: any, alert: SecurityAlert) {
  console.log('Handling critical security alert:', alert)
  
  // Block user if privilege escalation detected
  if (alert.type === 'privilege_escalation' && alert.user_id) {
    // Log the attempt
    await supabaseClient
      .from('auth_rate_limits')
      .upsert({
        identifier: alert.user_id,
        action_type: 'privilege_escalation',
        attempt_count: 999,
        blocked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
  }

  // Could integrate with external alerting systems here
  // e.g., send email, Slack notification, etc.
}

async function checkSuspiciousActivity(supabaseClient: any, params: any) {
  const { user_id, ip_address, action_type } = params
  
  // Check for multiple failed attempts
  const { data: attempts, error } = await supabaseClient
    .from('auth_rate_limits')
    .select('*')
    .or(`identifier.eq.${user_id},identifier.eq.${ip_address}`)
    .eq('action_type', action_type)
    .gte('first_attempt', new Date(Date.now() - 15 * 60 * 1000).toISOString())

  if (error) {
    throw new Error(`Failed to check suspicious activity: ${error.message}`)
  }

  const totalAttempts = attempts?.reduce((sum, attempt) => sum + attempt.attempt_count, 0) || 0
  const isSuspicious = totalAttempts >= 5

  if (isSuspicious) {
    await logSecurityEvent(supabaseClient, {
      type: 'suspicious_login',
      severity: 'high',
      user_id,
      details: {
        ip_address,
        action_type,
        attempt_count: totalAttempts
      },
      ip_address
    })
  }

  return new Response(
    JSON.stringify({ 
      suspicious: isSuspicious,
      attempt_count: totalAttempts 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getSecurityEvents(supabaseClient: any, params: any) {
  const { limit_count = 50, severity_filter, user_id_filter } = params
  
  let query = supabaseClient
    .from('security_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit_count)

  if (severity_filter) {
    query = query.eq('severity', severity_filter)
  }

  if (user_id_filter) {
    query = query.eq('user_id', user_id_filter)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to get security events: ${error.message}`)
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function cleanupExpiredSessions(supabaseClient: any) {
  console.log('Cleaning up expired sessions')
  
  const { error } = await supabaseClient.rpc('cleanup_expired_sessions')

  if (error) {
    throw new Error(`Failed to cleanup sessions: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}