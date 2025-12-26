# Deployment Guide - Arabisch Online Leren

## Environments

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | https://arabischetaalles.nl | main |
| Staging | https://staging.arabischetaalles.nl | staging |
| Development | localhost:5173 | feature/* |

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Supabase CLI (for edge functions)
- Terraform >= 1.0 (for IaC)

## Deployment Steps

### 1. Frontend Deployment

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build

# Preview locally
pnpm preview
```

### 2. Edge Functions Deployment

Edge functions deploy automatically via CI/CD. For manual deployment:

```bash
supabase functions deploy --project-ref xugosdedyukizseveahx
```

### 3. Database Migrations

Migrations are managed via Supabase Dashboard or CLI:

```bash
supabase db push --project-ref xugosdedyukizseveahx
```

## Environment Variables

### Frontend (Vite)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `VITE_SENTRY_DSN` - Sentry DSN (production only)
- `VITE_APP_ENV` - Environment name

### Edge Functions (Secrets)
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `ADMIN_INITIAL_PASSWORD` - Admin setup password

## Rollback Procedure

1. Revert to previous commit in GitHub
2. CI/CD will auto-deploy
3. For database rollbacks, use migration history in Supabase Dashboard

## Monitoring

- **Sentry**: Error tracking (production)
- **Supabase Dashboard**: Database & edge function logs
- **Cloudflare**: CDN & security analytics

## Health Checks

- Frontend: `/` (200 response)
- API: `https://xugosdedyukizseveahx.supabase.co/rest/v1/`
- Auth: `https://xugosdedyukizseveahx.supabase.co/auth/v1/health`
