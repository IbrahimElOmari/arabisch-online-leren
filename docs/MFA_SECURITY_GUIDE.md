# Multi-Factor Authentication (MFA) & Security Guide

**Version**: 1.0  
**Last Updated**: 2025-12-26

## Overview

This guide covers the implementation and configuration of Multi-Factor Authentication (MFA) and related security measures for the Arabisch Online Leren platform.

## 1. MFA Implementation

### 1.1 Supabase Auth MFA

Supabase provides built-in MFA support using TOTP (Time-based One-Time Passwords).

#### Enable MFA in Supabase Dashboard
1. Go to **Authentication** → **Providers**
2. Enable **MFA** under security settings
3. Configure TOTP settings

#### Frontend Implementation

```typescript
// src/hooks/useMFA.ts
import { supabase } from '@/integrations/supabase/client';

export const useMFA = () => {
  const enrollMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App'
    });
    
    if (error) throw error;
    return data;
  };

  const verifyMFA = async (factorId: string, code: string) => {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: factorId,
      code
    });
    
    if (error) throw error;
    return data;
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId
    });
    
    if (error) throw error;
  };

  return { enrollMFA, verifyMFA, unenrollMFA };
};
```

### 1.2 MFA Enrollment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │   Supabase  │     │  Auth App   │
│   Login     │────▶│   Returns   │────▶│   Scan QR   │
│             │     │   QR Code   │     │   Code      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Verify    │
                    │   TOTP Code │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   MFA       │
                    │   Enabled   │
                    └─────────────┘
```

## 2. Password Security

### 2.1 Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 2.2 Leaked Password Protection

Enable in Supabase Dashboard:
1. Go to **Authentication** → **Policies**
2. Enable **Leaked password protection**
3. Set action to **Warn** or **Block**

### 2.3 Password Validation Schema

```typescript
// src/lib/schemas.ts
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Wachtwoord moet minimaal 8 tekens zijn')
  .regex(/[A-Z]/, 'Wachtwoord moet minimaal één hoofdletter bevatten')
  .regex(/[a-z]/, 'Wachtwoord moet minimaal één kleine letter bevatten')
  .regex(/[0-9]/, 'Wachtwoord moet minimaal één cijfer bevatten')
  .regex(/[!@#$%^&*]/, 'Wachtwoord moet minimaal één speciaal teken bevatten');
```

## 3. Session Security

### 3.1 Session Configuration

```sql
-- Supabase Auth settings (Dashboard)
-- Session lifetime: 1 hour
-- Refresh token lifetime: 7 days
-- Refresh token reuse interval: 10 seconds
```

### 3.2 Session Monitoring

```typescript
// Track active sessions
const { data: sessions } = await supabase.auth.mfa.listFactors();

// Revoke all sessions except current
await supabase.auth.signOut({ scope: 'others' });
```

### 3.3 Session Security Headers

```typescript
// Edge function headers
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

## 4. Rate Limiting

### 4.1 Authentication Rate Limits

```sql
-- Check rate limit before auth
SELECT check_rate_limit(
  p_identifier := 'ip_address_or_email',
  p_action_type := 'login',
  p_max_attempts := 5,
  p_window_minutes := 15
);
```

### 4.2 Rate Limit Configuration

| Action | Max Attempts | Window | Block Duration |
|--------|-------------|--------|----------------|
| Login | 5 | 15 min | 1 hour |
| Password Reset | 3 | 1 hour | 4 hours |
| MFA Verify | 5 | 5 min | 15 min |
| API Calls | 100 | 1 min | 1 min |

## 5. Security Checklist

### 5.1 Authentication
- [x] Strong password requirements
- [ ] Leaked password protection (Supabase Dashboard)
- [ ] MFA enrollment available
- [x] Rate limiting on auth endpoints
- [x] Secure session management

### 5.2 Authorization
- [x] Role-based access control (RBAC)
- [x] `has_role()` RPC for role checks
- [x] RLS policies on all tables
- [x] Audit logging for role changes

### 5.3 Data Protection
- [x] Encryption at rest
- [x] Encryption in transit (TLS)
- [x] Input validation (Zod schemas)
- [x] XSS protection (DOMPurify)
- [x] CSRF protection

### 5.4 Monitoring
- [x] Security event logging
- [x] Failed login tracking
- [x] Anomaly detection alerts
- [x] Real-time error tracking (Sentry)

## 6. Implementation Steps

### 6.1 Enable MFA (Supabase Dashboard)
1. Navigate to Authentication → Policies
2. Enable Multi-Factor Authentication
3. Configure TOTP settings
4. Set enforcement level (optional, required for admin)

### 6.2 Enable Leaked Password Protection
1. Navigate to Authentication → Policies
2. Enable "Leaked password protection"
3. Choose action: Warn or Block

### 6.3 Configure Session Settings
1. Navigate to Authentication → URL Configuration
2. Set appropriate session lifetimes
3. Enable refresh token rotation

## 7. Troubleshooting

### Common Issues

**MFA Not Working**
- Verify device time is synchronized
- Check TOTP secret was saved correctly
- Ensure user has completed enrollment

**Session Expired Unexpectedly**
- Check session lifetime settings
- Verify refresh token is being used
- Check for clock skew between client and server

**Rate Limited**
- Wait for block duration to expire
- Contact admin to clear rate limit
- Check if IP is being shared (corporate network)

## 8. References

- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [OWASP Authentication Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
