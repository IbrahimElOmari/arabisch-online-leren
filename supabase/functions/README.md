# Supabase Edge Functions

This directory contains Deno-based Edge Functions for the Arabisch Online Leren platform.

## Structure

Each function is in its own directory with an `index.ts` file. All functions follow consistent patterns:

### Standard Pattern

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Your logic here...

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Environment Variables

All functions have access to these Supabase-managed environment variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (use with caution!)

Additional custom variables:
- `ADMIN_INITIAL_PASSWORD` - For seeding admin users
- `ENABLE_ADMIN` - Toggle admin operations
- `ENABLE_GDPR_TOOLS` - Toggle GDPR features

## Security Best Practices

### 1. **Always Use Secure RBAC**

❌ **NEVER** check roles from profiles table directly:
```typescript
// UNSAFE - can be manipulated!
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile.role === 'admin') { /* ... */ }
```

✅ **ALWAYS** use the secure `has_role` RPC function:
```typescript
// SAFE - uses SECURITY DEFINER function
const { data: hasAdminRole, error } = await supabase
  .rpc('has_role', { _user_id: user.id, _role: 'admin' });

if (hasAdminRole) { /* ... */ }
```

### 2. **Input Validation**

Always validate and sanitize user input:

```typescript
if (!data.name || typeof data.name !== 'string' || data.name.length > 100) {
  throw new Error('Invalid name');
}
```

### 3. **Error Handling**

Never expose sensitive error details to clients:

```typescript
catch (error) {
  console.error('Internal error:', error); // Log full error server-side
  return new Response(
    JSON.stringify({ error: 'Operation failed' }), // Generic message to client
    { status: 500, headers: corsHeaders }
  );
}
```

### 4. **Use Service Role Key Carefully**

The service role key bypasses RLS. Only use for:
- Admin operations after verifying admin status via `has_role`
- System operations (cleanup, migrations)
- Background jobs

## Available Functions

### Admin Functions
- `admin-ops` - Maintenance mode, backup jobs, audit logs
- `admin-manage-classes` - Class and user management
- `admin-impersonate` - Secure impersonation with audit trail

### Content Management
- `create-lesson-content` - Create lesson materials
- `create-questions` - Create quiz questions
- `schedule-lesson` - Schedule live lessons

### Enrollment & Payments
- `manage-enrollment` - Handle class enrollments
- `mock-enroll` - Testing enrollments without payment
- `stripe-webhook` - Process Stripe payment events

### Forum & Communication
- `manage-forum` - Forum operations
- `notify-task-created` - Notify students of new tasks
- `notify-admin-new-user` - Alert admins of new signups

### Security & Privacy
- `security-monitoring` - Log security events, detect suspicious activity
- `security-config-manager` - Manage security settings
- `rate-limiter` - Rate limiting for API calls
- `rate-limiter-enhanced` - Advanced rate limiting with Supabase storage
- `gdpr-tools` - Data export and deletion requests

### System
- `seed-database` - Initialize database with default data
- `upload-media` - Handle media uploads to Supabase Storage

## Testing Locally

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Serve a function locally
supabase functions serve function-name --env-file .env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```

## Deployment

Functions are automatically deployed when changes are pushed to the repository. Manual deployment:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name

# View logs
supabase functions logs function-name
```

## Version Management

**CRITICAL**: All functions MUST use the same `@supabase/supabase-js` version for consistency.

Current standard: **v2.50.5**

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
```

## Common Patterns

### Authentication Check

```typescript
const authHeader = req.headers.get('authorization');
if (!authHeader) {
  return new Response('Unauthorized', { status: 401, headers: corsHeaders });
}

const { data: { user }, error } = await supabase.auth.getUser(
  authHeader.replace('Bearer ', '')
);

if (error || !user) {
  return new Response('Invalid token', { status: 401, headers: corsHeaders });
}
```

### Admin Authorization

```typescript
const { data: isAdmin, error } = await supabase
  .rpc('has_role', { _user_id: user.id, _role: 'admin' });

if (error || !isAdmin) {
  return new Response('Admin access required', { status: 403, headers: corsHeaders });
}
```

### Audit Logging

```typescript
await supabase.rpc('log_audit_event', {
  p_action: 'user_created',
  p_entity_type: 'profile',
  p_entity_id: newUser.id,
  p_meta: { email: newUser.email }
});
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure `corsHeaders` are returned in ALL responses including errors
2. **Version conflicts**: All functions must use the same `@supabase/supabase-js` version
3. **RLS bypass**: Only use service role key for operations that genuinely need it
4. **Timeout**: Edge Functions have a 2-minute timeout. For long operations, use background jobs

### Debug Logging

```typescript
console.log('Debug info:', { userId: user.id, action: 'create' });
console.error('Error occurred:', error);
```

Logs are accessible via:
- Supabase Dashboard → Edge Functions → Function Name → Logs
- CLI: `supabase functions logs function-name`

## Further Reading

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime Documentation](https://deno.land/manual)
- [RBAC Security Guide](../SECURITY_NOTES.md)
