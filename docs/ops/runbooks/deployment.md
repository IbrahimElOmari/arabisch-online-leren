# 🚀 Deployment Runbook

## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test`)
- [ ] TypeScript errors resolved (`npm run typecheck`)
- [ ] Build successful (`npm run build`)
- [ ] Database migrations tested
- [ ] Feature flags configured

## Deployment Steps

### 1. Database Migrations
```bash
supabase db push --linked
supabase db diff --linked  # Verify
```

### 2. Edge Functions
```bash
supabase functions deploy --project-ref xugosdedyukizseveahx
```

### 3. Frontend (Automatic via Lovable)
- Push changes via Lovable interface
- Use "Publish" button for production

## Rollback Procedure

### Application
- Use Lovable version history
- Revert commit and republish

### Database
```bash
supabase db restore --backup-id <id>
```

## Post-Deployment Verification

- [ ] Health check returns 200
- [ ] Login flow works
- [ ] Dashboard loads
- [ ] No new errors in logs
