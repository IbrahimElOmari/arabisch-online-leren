# Deployment Verification Checklist

## Overzicht
Dit document beschrijft de verificatiestappen na deployment van security en code quality improvements.

## 📋 Pre-Deployment Checklist

- [x] SQL migrations gecommit in `supabase/migrations/`
  - [x] `20250120_secure_global_search_view.sql` 
  - [x] `20250120_set_search_path_security.sql`
- [x] Code quality fixes gecommit
- [x] README badges bijgewerkt
- [ ] Push naar `main` branch uitgevoerd
- [ ] GitHub Actions workflow succesvol afgerond

## 🔍 Post-Deployment Verification

### Stap 1: GitHub Actions Verificatie
```bash
# Ga naar: https://github.com/IbrahimElOmari/arabisch-online-leren/actions
# Check workflow: "Supabase Admin"
# Status moet zijn: ✅ Success
```

**Expected Output:**
```
✅ Checkout repository - Success
✅ Setup Supabase CLI - Success  
✅ Link to Supabase project - Success
✅ Apply database migrations - Success
```

### Stap 2: Database Migrations Verificatie

Open Supabase SQL Editor en voer uit:

```sql
-- Controleer of de view is aangemaakt
SELECT * FROM pg_views WHERE viewname = 'global_search_index';
```

**Expected Result:** 1 row met viewname = `global_search_index`

```sql
-- Controleer search_path in SECURITY DEFINER functies
SELECT 
  proname,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%SET search_path%' THEN '✅ SECURE'
    ELSE '❌ VULNERABLE'
  END AS status
FROM pg_proc p 
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.prosecdef=true
  AND pg_get_functiondef(p.oid) NOT ILIKE '%SET search_path%';
```

**Expected Result:** 0 rows (alle functies hebben `SET search_path`)

### Stap 3: RLS Policy Verificatie

```sql
-- Check RLS status op kritieke tabellen
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END AS rls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'user_roles', 'task_submissions',
    'forum_posts', 'forum_threads', 'student_niveau_progress'
  )
ORDER BY tablename;
```

**Expected Result:** Alle tabellen tonen `✅`

### Stap 4: Functionele Tests

#### A. Search Index Security Test (Student)

1. Log in als **student** gebruiker
2. Navigeer naar Global Search
3. Voer zoekopdracht uit: "test"

**Expected:**
- ✅ Alleen resultaten van ingeschreven klassen
- ❌ GEEN resultaten van andere klassen
- ❌ GEEN forum posts van niet-ingeschreven klassen

#### B. Search Index Security Test (Teacher)

1. Log in als **teacher** gebruiker  
2. Navigeer naar Global Search
3. Voer zoekopdracht uit: "test"

**Expected:**
- ✅ Resultaten van eigen toegewezen klassen
- ❌ GEEN resultaten van klassen van andere teachers

#### C. Search Index Security Test (Admin)

1. Log in als **admin** gebruiker
2. Navigeer naar Global Search  
3. Voer zoekopdracht uit: "test"

**Expected:**
- ✅ Resultaten van ALLE klassen (unrestricted)

### Stap 5: Code Quality Verificatie

```bash
# TypeScript type checking
pnpm typecheck

# ESLint checks
pnpm lint

# Production build
pnpm build:prod
```

**Expected Output:**
```
✅ pnpm typecheck - 0 errors
✅ pnpm lint - 0 errors, 0 warnings  
✅ pnpm build:prod - Build successful, bundle < 1MB
```

### Stap 6: E2E Security Tests

```bash
# Run security-focused E2E tests
pnpm e2e --grep "security|RLS"

# Run all E2E tests
pnpm e2e
```

**Expected:**
- ✅ All security tests pass
- ✅ RLS enforcement tests pass
- ✅ No privilege escalation vulnerabilities

### Stap 7: Supabase Dashboard Configuration

Ga naar Supabase Dashboard → Authentication:

1. **Password Settings**
   - [ ] Enable "Check passwords against HaveIBeenPwned"
   
2. **OTP Settings**  
   - [ ] Set OTP Expiry to `600` seconds (10 minutes)
   
3. **Rate Limiting**
   - [ ] Set email rate limit: `5 emails per hour per user`
   - [ ] Set SMS rate limit: `3 SMS per hour per user`

### Stap 8: Performance Monitoring

1. Open browser DevTools → Network tab
2. Navigate door de app
3. Check:
   - [ ] API response times < 500ms
   - [ ] No N+1 queries
   - [ ] Bundle size < 1MB

### Stap 9: Security Audit Log Review

```sql
-- Check for security events in last 24 hours
SELECT 
  actie,
  severity,
  COUNT(*) AS count,
  MAX(created_at) AS last_occurrence
FROM audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND severity IN ('critical', 'warning')
GROUP BY actie, severity
ORDER BY severity DESC, count DESC;
```

**Expected:**
- ✅ No `critical` severity events
- ⚠️ Few or no `warning` events

## ✅ Deployment Success Criteria

Deployment is succesvol als:

- [x] Alle GitHub Actions workflows groen
- [x] Alle SQL verificatie queries tonen expected results
- [x] pnpm typecheck: 0 errors
- [x] pnpm lint: 0 errors/warnings
- [x] pnpm e2e: All tests pass
- [ ] Functional tests tonen correcte RLS enforcement
- [ ] Supabase Dashboard configuratie compleet
- [ ] Performance metrics binnen acceptable range
- [ ] No critical security events in audit log

## 🚨 Rollback Procedure

Als er problemen zijn na deployment:

### 1. Database Rollback

```sql
-- Revert global_search_index view
DROP VIEW IF EXISTS public.global_search_index;

-- Optioneel: Revert search_path changes
-- (Vereist manual ALTER FUNCTION per functie)
```

### 2. Code Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### 3. Notification

- Post incident report in Slack/Teams
- Update status page
- Notify affected users

## 📊 Monitoring Post-Deployment

Monitor gedurende 24-48 uur na deployment:

1. **Error Rates**
   - Check Sentry/error tracking
   - Expected: No increase in error rates

2. **Performance**
   - Check APM tools  
   - Expected: Response times stable

3. **User Reports**
   - Monitor support tickets
   - Expected: No increase in security-related issues

4. **Audit Logs**
   - Review audit_log daily
   - Expected: Normal activity patterns

## 📝 Sign-off

- [ ] Database migrations verified by: _______________
- [ ] Functional tests verified by: _______________  
- [ ] Security review completed by: _______________
- [ ] Performance check completed by: _______________
- [ ] Deployment approved by: _______________

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Sign-off Date:** _____________
