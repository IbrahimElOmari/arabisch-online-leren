import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMITS = {
  'auth': { max: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 minutes
  'api': { max: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  'upload': { max: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
};

function getRateLimitKey(ip: string, type: string, userId?: string): string {
  return userId ? `${type}:user:${userId}` : `${type}:ip:${ip}`;
}

function checkRateLimit(key: string, limit: typeof RATE_LIMITS.auth): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New window or expired window
    const newRecord = { count: 1, resetTime: now + limit.windowMs };
    rateLimitStore.set(key, newRecord);
    return { allowed: true, remainingRequests: limit.max - 1, resetTime: newRecord.resetTime };
  }

  if (record.count >= limit.max) {
    return { allowed: false, remainingRequests: 0, resetTime: record.resetTime };
  }

  record.count++;
  rateLimitStore.set(key, record);
  return { allowed: true, remainingRequests: limit.max - record.count, resetTime: record.resetTime };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, userId } = await req.json();
    
    if (!type || !RATE_LIMITS[type as keyof typeof RATE_LIMITS]) {
      throw new Error('Invalid rate limit type');
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const limit = RATE_LIMITS[type as keyof typeof RATE_LIMITS];
    const key = getRateLimitKey(ip, type, userId);
    
    const result = checkRateLimit(key, limit);

    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': limit.max.toString(),
      'X-RateLimit-Remaining': result.remainingRequests.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    };

    if (!result.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `Too many ${type} requests. Try again later.`,
          resetTime: result.resetTime
        }),
        { 
          headers: responseHeaders,
          status: 429 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        allowed: true,
        remainingRequests: result.remainingRequests,
        resetTime: result.resetTime
      }),
      { 
        headers: responseHeaders,
        status: 200 
      }
    );

  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});