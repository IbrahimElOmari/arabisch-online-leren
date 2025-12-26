# Security Notes - Arabisch Online Leren

## Authentication & Authorization

### RBAC Implementation
- Roles stored in `user_roles` table (NOT in profiles)
- Use `has_role(user_id, role)` RPC for authorization checks
- Never check roles client-side for authorization

### Supported Roles
- `admin` - Full system access
- `leerkracht` - Teacher access (class management, grading)
- `leerling` - Student access (learning, forum)

## Row Level Security (RLS)

All tables have RLS enabled with policies for:
- SELECT: Based on role and ownership
- INSERT: Authenticated users with role checks
- UPDATE: Owner or admin only
- DELETE: Owner or admin only

## Input Validation

- All API inputs validated with Zod schemas
- HTML content sanitized with DOMPurify
- File uploads scanned and type-checked

## Rate Limiting

- Login attempts: 5 per minute
- API requests: 100 per 5 minutes
- File uploads: 10 per hour

## Session Security

- JWT tokens with 1-hour expiry
- Session timeout warnings at 5 minutes
- Auto-logout on inactivity

## Sensitive Data Handling

- Passwords never logged
- PII removed from error reports
- Audit logs for admin actions

## Security Headers

Configured via Cloudflare:
- Strict-Transport-Security
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

## Incident Response

1. Identify and contain the issue
2. Check audit logs for scope
3. Notify affected users if needed
4. Document and implement fix
5. Post-mortem review

## Reporting Vulnerabilities

Contact: security@arabischetaalles.nl
