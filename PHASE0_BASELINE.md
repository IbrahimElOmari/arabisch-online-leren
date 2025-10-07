# Phase 0 - Baseline Report
**Branch**: `chore/full-hardening`
**Date**: 2025-01-10
**Status**: Pre-implementation verification

## Package Manager
```bash
$ jq .packageManager package.json
"pnpm@8.15.0"
```
✅ Correct package manager configured

## Lockfiles
```bash
$ ls -la | grep lock
pnpm-lock.yaml (present)
package-lock.json (removed in previous phase)
```
✅ Single lockfile (pnpm) in use

## Scripts Status
```json
{
  "dev": "✅ Present",
  "build": "✅ Present", 
  "typecheck": "✅ Present",
  "lint": "⚠️ MISSING - will add",
  "test": "✅ Present",
  "test:run": "✅ Present",
  "test:coverage": "✅ Present",
  "e2e": "✅ Present",
  "e2e:ci": "✅ Present",
  "e2e:ui": "✅ Present"
}
```

## Critical Issues Identified

### 1. **SECURITY CRITICAL**: Role stored in profiles table
- Current: `profiles.role` column with enum type
- Risk: Client-side manipulation → privilege escalation
- Fix Required: Implement `user_roles` table with SECURITY DEFINER function

### 2. **BUILD BLOCKER**: Edge Functions version mismatch
- Multiple @supabase/supabase-js versions in functions
- Causing Deno import errors
- Fix Required: Unify all edge functions to v2.50.5

### 3. **.gitignore**: Duplicate entries
- Multiple .env, coverage/, logs/ entries
- Fix Required: Deduplicate and organize

### 4. **PWA**: Potential SW conflict
- VitePWA configured with navigateFallback
- Manual SW registration removed (previous phase)
- Verify: offline.html must exist

### 5. **Monitoring**: Not activated
- src/lib/monitoring.ts exists but not imported
- Fix Required: Import in src/main.tsx

### 6. **Bundle Size**: No lazy loading
- All routes loaded upfront
- Analytics (recharts) always in main bundle
- Fix Required: Implement route-level code splitting

### 7. **i18n**: Hardcoded strings
- Multiple components with NL strings
- Fix Required: Replace with t() calls

## Test Execution Plan
After all fixes:
1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test:coverage`
5. `pnpm e2e:ci`
6. `pnpm build`

## Next Steps
Proceed with implementation phases 1-15 as specified.
