import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_PROJECT_ID = 'xugosdedyukizseveahx';
const MANAGEMENT_API_TOKEN = Deno.env.get('SUPABASE_MANAGEMENT_API_TOKEN');

interface SecurityConfigResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

async function updateOTPExpiry(): Promise<SecurityConfigResult> {
  try {
    console.log('Starting OTP expiry update to 300 seconds...');
    
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          OTP_EXPIRY: 300, // 5 minutes in seconds
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('OTP expiry update failed:', error);
      return {
        success: false,
        message: 'Failed to update OTP expiry',
        error: error
      };
    }

    const result = await response.json();
    console.log('OTP expiry updated successfully:', result);
    
    return {
      success: true,
      message: 'OTP expiry updated to 300 seconds',
      details: result
    };
  } catch (error) {
    console.error('Error updating OTP expiry:', error);
    return {
      success: false,
      message: 'Error updating OTP expiry',
      error: error.message
    };
  }
}

async function enablePasswordLeakProtection(): Promise<SecurityConfigResult> {
  try {
    console.log('Enabling password leak protection...');
    
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          PASSWORD_MIN_LENGTH: 8,
          PASSWORD_REQUIRED_CHARACTERS: 'lowercase,uppercase,numbers',
          EXTERNAL_PASSWORD_BREACH_CHECK: true,
          BREACH_CHECK_PROVIDER: 'haveibeenpwned',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Password leak protection update failed:', error);
      return {
        success: false,
        message: 'Failed to enable password leak protection',
        error: error
      };
    }

    const result = await response.json();
    console.log('Password leak protection enabled successfully:', result);
    
    return {
      success: true,
      message: 'Password leak protection enabled with HaveIBeenPwned integration',
      details: result
    };
  } catch (error) {
    console.error('Error enabling password leak protection:', error);
    return {
      success: false,
      message: 'Error enabling password leak protection',
      error: error.message
    };
  }
}

async function upgradePostgres(): Promise<SecurityConfigResult> {
  try {
    console.log('Starting Postgres upgrade...');
    
    // First, check current version and available upgrades
    const statusResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database`,
      {
        headers: {
          'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`,
        },
      }
    );

    if (!statusResponse.ok) {
      const error = await statusResponse.text();
      console.error('Failed to check database status:', error);
      return {
        success: false,
        message: 'Failed to check database status',
        error: error
      };
    }

    const dbInfo = await statusResponse.json();
    console.log('Current database info:', dbInfo);

    // Trigger upgrade to latest version
    const upgradeResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/upgrade`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MANAGEMENT_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_version: 'latest',
        }),
      }
    );

    if (!upgradeResponse.ok) {
      const error = await upgradeResponse.text();
      console.error('Postgres upgrade failed:', error);
      return {
        success: false,
        message: 'Failed to start Postgres upgrade',
        error: error
      };
    }

    const upgradeResult = await upgradeResponse.json();
    console.log('Postgres upgrade initiated:', upgradeResult);
    
    return {
      success: true,
      message: 'Postgres upgrade initiated successfully',
      details: upgradeResult
    };
  } catch (error) {
    console.error('Error upgrading Postgres:', error);
    return {
      success: false,
      message: 'Error upgrading Postgres',
      error: error.message
    };
  }
}

async function logSecurityAction(action: string, result: SecurityConfigResult) {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.50.5');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.from('audit_log').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      actie: `security_${action}`,
      details: {
        action: action,
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
        details: result.details,
        error: result.error
      },
      severity: result.success ? 'info' : 'error'
    });
  } catch (error) {
    console.error('Failed to log security action:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!MANAGEMENT_API_TOKEN) {
    return new Response(
      JSON.stringify({ 
        error: 'SUPABASE_MANAGEMENT_API_TOKEN not configured' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { action } = await req.json();
    
    console.log(`Starting security configuration: ${action || 'all'}`);
    
    const results: Record<string, SecurityConfigResult> = {};
    
    // Execute all security fixes or specific action
    if (!action || action === 'all' || action === 'otp') {
      console.log('Executing OTP expiry fix...');
      results.otp = await updateOTPExpiry();
      await logSecurityAction('otp_expiry_update', results.otp);
    }
    
    if (!action || action === 'all' || action === 'password') {
      console.log('Executing password leak protection fix...');
      results.password = await enablePasswordLeakProtection();
      await logSecurityAction('password_leak_protection', results.password);
    }
    
    if (!action || action === 'all' || action === 'postgres') {
      console.log('Executing Postgres upgrade...');
      results.postgres = await upgradePostgres();
      await logSecurityAction('postgres_upgrade', results.postgres);
    }
    
    // Calculate overall success
    const allSuccessful = Object.values(results).every(r => r.success);
    const summary = {
      success: allSuccessful,
      message: allSuccessful 
        ? 'All security configurations applied successfully' 
        : 'Some security configurations failed',
      results: results,
      timestamp: new Date().toISOString()
    };
    
    console.log('Security configuration complete:', summary);
    
    return new Response(JSON.stringify(summary), {
      status: allSuccessful ? 200 : 207, // 207 = Multi-Status
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Security configuration error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});