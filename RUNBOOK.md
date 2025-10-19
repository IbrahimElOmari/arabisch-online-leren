# Runbook: Arabisch Online Leren

## Productie Operaties Handleiding

### Inhoudsopgave
1. [Deployment Procedures](#deployment-procedures)
2. [Rollback Procedures](#rollback-procedures)
3. [Incident Response](#incident-response)
4. [Backup & Recovery](#backup--recovery)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Common Issues](#common-issues)

---

## Deployment Procedures

### Pre-Deployment Checklist
```bash
# 1. Verify all tests pass
pnpm lint
pnpm typecheck
pnpm test:run
pnpm e2e:ci

# 2. Build production bundle
pnpm build:prod

# 3. Check bundle sizes
du -sh dist/
du -sh dist/assets/*.js
du -sh dist/assets/*.css

# 4. Preview production build locally
pnpm preview
# Test critical flows: login, dashboard, forum, tasks

# 5. Database migrations (if any)
# Check supabase/migrations/ for new files
# Apply via Supabase Dashboard → SQL Editor
```

### Deployment Steps
```bash
# 1. Create release tag
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x

# 2. Deploy to Lovable (automatic via CI/CD)
# Or manual deploy:
pnpm deploy

# 3. Verify deployment
curl -I https://your-domain.com
# Expected: HTTP/2 200

# 4. Smoke test critical paths
# - Login
# - Dashboard loading
# - Forum posts visible
# - Task submission
```

### Post-Deployment Verification
```bash
# 1. Check Sentry for new errors
# Navigate to: https://sentry.io/organizations/your-org/issues/

# 2. Monitor Web Vitals
# Check analytics_events table for web_vital entries

# 3. Verify database connections
# Supabase Dashboard → Logs → Postgres Logs

# 4. Check API response times
# Monitor first 30 minutes for anomalies
```

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)
```bash
# Option 1: Revert Git commit
git revert HEAD
git push origin main
# CI/CD will auto-deploy previous version

# Option 2: Rollback via Lovable Dashboard
# Navigate to: Deployments → Select previous version → Rollback
```

### Database Rollback
```bash
# 1. Check migration history
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 5;

# 2. Revert migration (if needed)
# Create rollback script in supabase/migrations/
# Example: 20250116_rollback_indexes.sql

DROP INDEX IF EXISTS idx_forum_posts_thread_id;
-- ... other rollback statements

# 3. Apply via Supabase Dashboard → SQL Editor
```

---

## Incident Response

### P0: Production Down (Critical)
**Response Time**: < 5 minutes

#### Symptoms
- Site completely unavailable (HTTP 5xx)
- Database connection failures
- Authentication broken

#### Actions
1. **Immediate**:
   ```bash
   # Check Supabase status
   curl https://xugosdedyukizseveahx.supabase.co/rest/v1/
   
   # Check Lovable status
   # Navigate to: https://status.lovable.app
   
   # Check Sentry
   # Look for error spikes
   ```

2. **Triage**:
   - If Supabase issue → Wait for Supabase or switch to backup (if available)
   - If deployment issue → Rollback immediately
   - If database migration issue → Revert migration

3. **Communication**:
   - Post status update on homepage/banner
   - Notify users via email (if contact list available)
   - Update social media

### P1: Degraded Performance (High)
**Response Time**: < 30 minutes

#### Symptoms
- Slow page loads (> 5s)
- High error rate (> 1%)
- Database query timeouts

#### Actions
1. **Investigate**:
   ```sql
   -- Check slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   
   -- Check connection pool
   SELECT count(*) as connections, state
   FROM pg_stat_activity
   GROUP BY state;
   ```

2. **Mitigate**:
   - Enable Redis caching for hot queries
   - Increase database connection pool
   - Add missing indexes
   - Implement rate limiting if DDoS

### P2: Minor Issues (Medium)
**Response Time**: < 2 hours

#### Symptoms
- Feature not working as expected
- UI glitches
- Non-critical errors in Sentry

#### Actions
- Create bug report in issue tracker
- Assign to developer
- Plan fix for next deployment

---

## Backup & Recovery

### Automated Backups
- **Frequency**: Daily at 03:00 UTC
- **Retention**: 7 days (Supabase default)
- **Location**: Supabase managed backups

### Manual Backup
```bash
# Create manual backup via Supabase Dashboard
# Dashboard → Settings → Database → Backups → Create Manual Backup

# Download backup file (if needed)
# Dashboard → Settings → Database → Backups → Download
```

### Point-in-Time Recovery (PITR)
```bash
# Available for Supabase Pro+ plans
# Dashboard → Settings → Database → Point-in-Time Recovery
# Select timestamp → Restore
```

### Restore from Backup
```bash
# 1. Download backup file
# 2. Create new Supabase project (or use staging)
# 3. Restore via psql:

psql -h db.xugosdedyukizseveahx.supabase.co \
     -U postgres \
     -d postgres \
     -f backup_file.sql

# 4. Update connection strings in app
# 5. Test thoroughly before switching DNS
```

---

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Error Rate**: < 0.5%
2. **Response Time (p95)**: < 500ms
3. **Database CPU**: < 70%
4. **Database Memory**: < 80%
5. **Connection Pool Usage**: < 80%

### Sentry Alerts
```
Alert: "Production Error Spike"
Condition: Errors > 10 in 5 minutes
Action: Email to team@example.com

Alert: "High Error Rate"
Condition: Error rate > 5% for 10 minutes
Action: Email + PagerDuty

Alert: "Critical Error"
Condition: Any error with level=fatal
Action: Immediate PagerDuty
```

### Database Alerts
```
Alert: "High CPU Usage"
Condition: CPU > 80% for 5 minutes
Action: Email to admins

Alert: "Connection Pool Exhausted"
Condition: Active connections > 90% of max
Action: Email + auto-scale (if configured)

Alert: "Slow Query"
Condition: Query time > 5 seconds
Action: Log to Slack #db-alerts
```

### Web Vitals Thresholds
```
Good Performance:
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

Needs Investigation:
- LCP: > 4s
- FID: > 300ms
- CLS: > 0.25
```

---

## Common Issues

### Issue: "User cannot login"
**Symptoms**: Login form submits but returns error

**Diagnosis**:
```bash
# Check auth logs
# Supabase Dashboard → Authentication → Logs

# Check for rate limiting
SELECT * FROM auth_rate_limits
WHERE identifier = 'user@email.com'
AND blocked_until > NOW();

# Check user account status
SELECT email, confirmed_at, banned_until
FROM auth.users
WHERE email = 'user@email.com';
```

**Resolution**:
- If rate limited: Clear via `DELETE FROM auth_rate_limits WHERE identifier = 'user@email.com'`
- If unconfirmed: Resend confirmation email
- If banned: Update `banned_until` to NULL

### Issue: "Student cannot see class content"
**Symptoms**: Dashboard shows no classes/levels

**Diagnosis**:
```sql
-- Check enrollment status
SELECT i.*, k.name as class_name
FROM inschrijvingen i
JOIN klassen k ON k.id = i.class_id
WHERE i.student_id = 'user-uuid';

-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'inschrijvingen';
```

**Resolution**:
- If payment_status = 'pending': Update to 'paid'
- If no enrollment: Create enrollment record
- If RLS issue: Check `is_enrolled_in_class()` function

### Issue: "Forum posts not loading"
**Symptoms**: Empty forum or infinite loading

**Diagnosis**:
```sql
-- Check forum posts exist
SELECT COUNT(*) FROM forum_posts
WHERE class_id = 'class-uuid';

-- Check RLS allows access
SELECT * FROM forum_posts
WHERE class_id = 'class-uuid'
LIMIT 1;

-- Check realtime subscription
SELECT * FROM realtime.subscription;
```

**Resolution**:
- If no posts: Expected behavior (empty state)
- If RLS blocks: Verify user enrollment
- If realtime issue: Restart realtime server

### Issue: "Slow database queries"
**Symptoms**: Page loads > 5 seconds

**Diagnosis**:
```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check missing indexes
SELECT schemaname, tablename, attname
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.5;
```

**Resolution**:
- Add missing indexes (see `20250116_performance_indexes.sql`)
- Optimize N+1 queries (use service layer)
- Enable Redis caching for hot data

### Issue: "High memory usage"
**Symptoms**: Database crashes, OOM errors

**Diagnosis**:
```sql
-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Check for bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS size,
       n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > n_live_tup
ORDER BY n_dead_tup DESC;
```

**Resolution**:
- Run VACUUM ANALYZE on bloated tables
- Archive old data (> 1 year)
- Upgrade database plan if needed

---

## Emergency Contacts

**Primary On-Call**: [Your Name] - [Phone] - [Email]  
**Secondary On-Call**: [Backup Name] - [Phone] - [Email]  
**Supabase Support**: support@supabase.com  
**Lovable Support**: support@lovable.dev  

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-16 | 1.0 | Initial runbook created | Lovable AI |

---

**Last Updated**: 2025-01-16  
**Next Review**: 2025-02-16
