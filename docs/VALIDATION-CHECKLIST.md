# PR7/PR8/PR9 Validation Checklist

## 🔒 Security Validation

### Database RLS Policies
- [ ] Run `docs/MANUAL-SECURITY-MIGRATION.sql` in Supabase SQL Editor
- [ ] Verify RLS enabled on all critical tables:
  ```sql
  SELECT c.relname, c.relrowsecurity 
  FROM pg_class c 
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND NOT c.relrowsecurity;
  ```
- [ ] Run Supabase linter: `supabase db lint`
- [ ] Verify no CRITICAL issues remain
- [ ] Review WARNING issues and document accepted risks

### Function Security
- [ ] Verify all SECURITY DEFINER functions have search_path set
- [ ] Test functions don't allow SQL injection
- [ ] Verify functions use proper error handling

### Edge Function Security
- [ ] Verify edge functions validate inputs
- [ ] Check CORS headers are correctly configured
- [ ] Test authentication requirements work
- [ ] Review function logs for errors

## 🧪 Functional Testing

### PR8: Monitoring & Notifications
- [ ] Admin can view system metrics dashboard
- [ ] Real-time metrics update without refresh
- [ ] Notifications appear for critical events
- [ ] Health indicator shows correct status (green/yellow/red)
- [ ] Notification bell shows unread count
- [ ] Mark as read functionality works
- [ ] Toast notifications appear for critical alerts

### PR9: Gamification
- [ ] Student profile creates on first XP award
- [ ] XP awards trigger correctly
- [ ] Level-up toast notifications appear
- [ ] Challenges display with correct progress
- [ ] Challenge completion awards correct XP
- [ ] Badges unlock at correct thresholds
- [ ] Leaderboards calculate correctly (class/global/niveau)
- [ ] Streak counter increments daily
- [ ] SPEELS mode shows colorful, animated UI (age ≤15)
- [ ] PRESTIGE mode shows refined, status-focused UI (age >15)

### PR7: Admin Operations
- [ ] Admin can trigger backup jobs
- [ ] Backup jobs show correct status (queued/running/success/failed)
- [ ] Maintenance mode toggle works
- [ ] Audit log displays recent events
- [ ] Feature flags can be enabled/disabled
- [ ] Feature flag rollout percentage works

## ⚡ Performance Testing

### Backend Performance
- [ ] Run k6 load test:
  ```bash
  k6 run load-test.js --vus 10 --duration 30s
  ```
- [ ] Verify API response times <200ms (p95)
- [ ] Check database connection pool not exhausted
- [ ] Monitor edge function cold start times

### Frontend Performance
- [ ] Run Lighthouse audit (Performance score ≥90)
- [ ] Check First Contentful Paint <1.8s
- [ ] Verify Time to Interactive <3.8s
- [ ] Test on slow 3G connection
- [ ] Measure real-time subscription overhead

## ♿ Accessibility Testing

### Automated Checks
- [ ] Run axe-core scan:
  ```bash
  npm run test:a11y
  ```
- [ ] Fix all CRITICAL and SERIOUS issues
- [ ] Review MODERATE issues

### Manual Checks
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces all content correctly
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text)
- [ ] No flashing content (seizure risk)
- [ ] Form labels properly associated
- [ ] Error messages are descriptive

### WCAG 2.1 AA Compliance
- [ ] 1.1.1 Non-text Content (Alt text)
- [ ] 1.4.3 Contrast (Minimum)
- [ ] 2.1.1 Keyboard (No keyboard trap)
- [ ] 2.4.7 Focus Visible
- [ ] 3.2.1 On Focus (No unexpected changes)
- [ ] 3.3.1 Error Identification
- [ ] 4.1.2 Name, Role, Value

## 🌐 Internationalization (i18n)

### Dutch (NL) - Primary
- [ ] All UI text translated
- [ ] Date/time formats correct (DD-MM-YYYY)
- [ ] Number formats correct (1.234,56)
- [ ] Error messages in Dutch

### English (EN) - Secondary
- [ ] All UI text translated
- [ ] Date/time formats correct (MM/DD/YYYY)
- [ ] Number formats correct (1,234.56)
- [ ] Error messages in English

### Arabic (AR) - RTL Support
- [ ] Layout flips correctly for RTL
- [ ] Icons mirror appropriately
- [ ] Text alignment correct
- [ ] Date/time formats correct

## 📱 Responsive Design

### Breakpoints to Test
- [ ] Mobile (320px - 640px)
- [ ] Tablet (641px - 1024px)
- [ ] Desktop (1025px - 1920px)
- [ ] Ultra-wide (>1920px)

### Components
- [ ] Admin Dashboard responsive
- [ ] Gamification page responsive
- [ ] Notifications panel mobile-friendly
- [ ] Leaderboards scroll/paginate on mobile
- [ ] XP bar displays correctly on all sizes

## 🧪 Unit Test Coverage

### Required Coverage: ≥90%

- [ ] Run test suite: `npm test`
- [ ] Generate coverage: `npm run test:coverage`
- [ ] Verify coverage meets threshold:
  - Statements: ≥90%
  - Branches: ≥90%
  - Functions: ≥90%
  - Lines: ≥90%

### Critical Paths to Test
- [ ] XP awarding logic
- [ ] Level calculation
- [ ] Challenge completion
- [ ] Leaderboard calculation
- [ ] Notification delivery
- [ ] Health check aggregation

## 🔄 Integration Testing

### Edge Function Integration
- [ ] award-xp creates correct XP activity records
- [ ] complete-challenge updates student_challenges
- [ ] calculate-leaderboard generates correct rankings
- [ ] admin-health-check returns proper status
- [ ] admin-notifications-mark-read updates records

### Database Integration
- [ ] Triggers fire correctly (updated_at)
- [ ] Foreign key constraints enforced
- [ ] RLS policies apply correctly
- [ ] Realtime subscriptions work

## 🎭 End-to-End Testing

### User Flows
- [ ] Student Journey:
  1. Complete task
  2. XP awarded
  3. Level up notification
  4. See leaderboard position update
  5. Unlock badge
  6. Challenge progress updates

- [ ] Admin Journey:
  1. View dashboard metrics
  2. Receive critical alert
  3. Mark notification as read
  4. Toggle feature flag
  5. View audit log

- [ ] Teacher Journey:
  1. View class leaderboard
  2. Award bonus XP
  3. See student progress
  4. Post to forum
  5. Grade assignment

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No ESLint errors: `npm run lint`
- [ ] Security migrations applied
- [ ] Environment variables configured
- [ ] Edge functions deployed
- [ ] Database backups enabled

### Post-Deployment
- [ ] Smoke test critical paths
- [ ] Monitor error rates
- [ ] Check edge function logs
- [ ] Verify real-time updates working
- [ ] Test notification delivery
- [ ] Monitor database performance

### Rollback Plan
- [ ] Database backup confirmed available
- [ ] Rollback procedure documented
- [ ] Previous edge function versions available
- [ ] Feature flags can disable new features

## 📊 Metrics to Monitor

### System Health
- API latency (p50, p95, p99)
- Error rate (target: <1%)
- Database connection pool usage
- Edge function cold starts
- Real-time subscription count

### User Engagement
- Daily active users
- XP awarded per day
- Challenges completed
- Leaderboard views
- Notifications sent

### Performance
- Page load time (target: <3s)
- Time to interactive (target: <3.8s)
- API response time (target: <200ms p95)
- Database query time (target: <100ms p95)

## 🔍 Security Review

### Pre-Production
- [ ] Run OWASP ZAP scan
- [ ] Review all RLS policies
- [ ] Test with non-admin/non-authenticated users
- [ ] Verify sensitive data redacted in logs
- [ ] Check rate limiting works
- [ ] Test CSRF protection
- [ ] Verify input validation

### Ongoing
- [ ] Weekly security scan
- [ ] Monthly dependency updates
- [ ] Quarterly penetration test
- [ ] Annual security audit

## ✅ Definition of Done

PR7/PR8/PR9 are considered complete when:

- [ ] All code implemented and reviewed
- [ ] All tests passing (≥90% coverage)
- [ ] All security issues resolved or documented
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] i18n complete for all supported languages
- [ ] Documentation complete
- [ ] Edge functions deployed and monitored
- [ ] Database migrations applied
- [ ] Validation checklist 100% complete
- [ ] Stakeholder sign-off received

## 📝 Notes Section

Use this space to document any deviations, known issues, or acceptance criteria adjustments:

---

**Date Completed**: ___________  
**Completed By**: ___________  
**Sign-off**: ___________
