# DEPLOYMENT RUNBOOK
**Arabisch Online Leren - Production Deployment Guide**

---

## 🎯 PRE-DEPLOYMENT CHECKLIST

### 1. Code Quality ✅
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] Lint checks pass (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Bundle size within budget (< 250KB main, < 100KB chunks)

### 2. Environment Variables ✅
- [ ] `.env.production` configured
- [ ] Supabase URL and anon key set
- [ ] All secrets added to hosting platform
- [ ] API endpoints verified

### 3. Database ✅
- [ ] All migrations applied
- [ ] RLS policies enabled on all tables
- [ ] Database backups configured
- [ ] Test data cleared from production

### 4. Security ✅
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Session timeout configured (30 min)
- [ ] Content Security Policy headers set

### 5. Performance ✅
- [ ] Lighthouse score ≥ 95
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Image optimization verified

### 6. Monitoring ✅
- [ ] Error tracking (Sentry) configured
- [ ] Analytics enabled
- [ ] Health check endpoint working (`/functions/health`)
- [ ] Uptime monitoring setup

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Pre-Deploy Validation
```bash
# Run all checks
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# Verify bundle sizes
ls -lh dist/assets/*.js
```

### Step 2: Database Migrations
```bash
# Apply any pending migrations
supabase db push

# Verify RLS policies
supabase db diff
```

### Step 3: Build for Production
```bash
# Clean build
rm -rf dist/
pnpm build

# Verify output
ls -R dist/
```

### Step 4: Deploy to Hosting
```bash
# Deploy via Lovable platform
# Or manual deployment:
# - Upload dist/ contents to hosting provider
# - Configure environment variables
# - Enable HTTPS
```

### Step 5: Post-Deploy Verification
```bash
# 1. Health check
curl https://yourdomain.com/functions/health

# 2. Check main routes
curl -I https://yourdomain.com/
curl -I https://yourdomain.com/auth
curl -I https://yourdomain.com/dashboard

# 3. Verify SSL
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Step 6: Smoke Tests
- [ ] Open site in browser
- [ ] Test authentication (login/logout)
- [ ] Navigate to all main sections
- [ ] Test a critical user flow (e.g., student enrollment)
- [ ] Check console for errors
- [ ] Verify mobile responsiveness

---

## 🔄 ROLLBACK PROCEDURE

If issues are detected after deployment:

### Immediate Rollback
```bash
# Option 1: Revert to previous version via hosting dashboard

# Option 2: Deploy previous working commit
git checkout <previous-commit>
pnpm build
# Deploy dist/
```

### Database Rollback
```bash
# If database changes need rollback
supabase db reset --db-url <production-url>
# Then reapply migrations up to previous version
```

---

## 📊 POST-DEPLOYMENT MONITORING

### First 24 Hours
Monitor these metrics:
- Error rate (should be < 1%)
- Response time (p95 < 500ms)
- User authentication success rate
- Page load times (LCP < 2.5s)

### Week 1
- User feedback collection
- Performance trends
- Error patterns
- Database query performance

### Alerts to Configure
- Error rate spike (> 5%)
- Response time degradation (> 1s p95)
- Database connection issues
- High memory usage (> 80%)

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### Build Fails
```bash
# Clear cache and retry
rm -rf node_modules dist .vite
pnpm install
pnpm build
```

#### Database Connection Errors
- Verify Supabase URL and key
- Check network connectivity
- Verify RLS policies
- Check database logs

#### High Memory Usage
- Check for memory leaks in components
- Verify lazy loading is working
- Review bundle size

#### Slow Page Load
- Check CDN configuration
- Verify image optimization
- Review bundle splitting
- Check network waterfall

---

## 📞 SUPPORT CONTACTS

- **Tech Lead**: [contact info]
- **DevOps**: [contact info]
- **Database Admin**: [contact info]
- **Emergency Hotline**: [number]

---

## 📝 POST-MORTEM TEMPLATE

If incident occurs:

### Incident Summary
- Date/Time:
- Duration:
- Impact:
- Root Cause:

### Timeline
- [Time] - Issue detected
- [Time] - Investigation started
- [Time] - Root cause identified
- [Time] - Fix deployed
- [Time] - Verified resolved

### Action Items
- [ ] Preventive measures
- [ ] Monitoring improvements
- [ ] Documentation updates
- [ ] Team communication

---

**Last Updated**: 2025-10-26  
**Version**: 1.0.0  
**Status**: ✅ Ready for Production
