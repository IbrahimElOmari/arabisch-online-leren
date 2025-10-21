# ✅ FASE 0 - GEBRUIKER VERIFICATIE CHECKLIST

**Datum:** 2025-01-21  
**Status:** GEREED VOOR HANDMATIGE VERIFICATIE

---

## 🎯 INSTRUCTIES

Deze checklist moet **door de gebruiker** worden uitgevoerd. De AI kan geen shell-commando's, git-operaties, of Supabase-queries uitvoeren.

---

## STAP 1: Verifieer 0 Errors & 0 Warnings

### 1.1 TypeScript Controle
```bash
cd /path/to/project
pnpm typecheck
```
**Verwacht resultaat:** Geen errors, schoon eindigt.

### 1.2 ESLint Controle
```bash
pnpm lint --max-warnings=0
```
**Verwacht resultaat:** Geen warnings, exit code 0.

### 1.3 Productie Build
```bash
pnpm build:prod
```
**Verwacht resultaat:** Build succesvol, geen TypeScript/ESLint meldingen.

**ACTIE:** Als er NOG warnings zijn:
- Noteer de exacte foutmelding
- Fix de issue (unused import/variable/etc.)
- Herhaal stap 1.1-1.3 tot 100% schoon

---

## STAP 2: Commit & Push Finale Code

```bash
# Controleer status
git status

# Voeg alle wijzigingen toe
git add .

# Commit
git commit -m "chore(phase0): final cleanup and zero warnings"

# Push naar main
git push origin main
```

**ACTIE:** Noteer de commit-hash voor het rapport:
```bash
git log -1 --oneline
```
Bijvoorbeeld: `abc1234 chore(phase0): final cleanup and zero warnings`

---

## STAP 3: Controleer CI/CD Workflows

### 3.1 Open GitHub Actions
- Ga naar: `https://github.com/{YOUR_REPO}/actions`
- Zoek de workflow-run die zojuist is gestart

### 3.2 Controleer "build-and-test"
- Status moet **groen** (✅) worden
- Bij rood: open logs, fix issue, push opnieuw

### 3.3 Controleer "supabase-admin"  
- Status moet **groen** (✅) worden
- Bij rood: controleer migratie-errors, fix, push opnieuw

**ACTIE:** Maak screenshot van groene workflows of noteer:
- ✅ build-and-test: SUCCESS
- ✅ supabase-admin: SUCCESS

---

## STAP 4: Voer Verificatiescripts Uit in Supabase

### 4.1 Open Supabase SQL Editor
- Ga naar: `https://supabase.com/dashboard/project/{PROJECT_ID}/sql`

### 4.2 Query A: Global Search Index
```sql
SELECT viewname 
FROM pg_views 
WHERE viewname='global_search_index';
```
**Verwacht:** 1 record met `viewname = 'global_search_index'`

### 4.3 Query B: Security Definer Functions
```sql
SELECT COUNT(*) 
FROM pg_proc
WHERE pronamespace='public'::regnamespace
  AND prosecdef=true
  AND pg_get_functiondef(oid) NOT ILIKE '%SET search_path%';
```
**Verwacht:** `count = 0` (alle functies hebben SET search_path)

### 4.4 Query C: RLS Status
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public'
  AND tablename IN (
    'profiles', 'klassen', 'inschrijvingen', 'lessen',
    'forum_posts', 'forum_threads', 'task_submissions',
    'tasks', 'user_roles'
  )
ORDER BY tablename;
```
**Verwacht:** Alle rijen hebben `rowsecurity = true`

**ACTIE:** Sla query-resultaten op (screenshot of copy-paste).

---

## STAP 5: Werk Rapport Bij

### 5.1 Vul Verificatie Resultaten In
Open `docs/FASE0_DEPLOYMENT_FINAL.md` en vul sectie "VERIFICATIE RESULTATEN" in:

```markdown
## ✅ VERIFICATIE RESULTATEN

**Uitgevoerd op:** [DATUM] [TIJD]  
**Door:** [JOUW NAAM/USERNAME]

### Build & Lint
- ✅ `pnpm typecheck`: 0 errors
- ✅ `pnpm lint --max-warnings=0`: 0 warnings  
- ✅ `pnpm build:prod`: SUCCESS

### Git
- **Commit hash:** abc1234
- **Branch:** main
- **Pushed at:** [TIMESTAMP]

### CI/CD
- ✅ GitHub Actions: build-and-test - SUCCESS
- ✅ GitHub Actions: supabase-admin - SUCCESS

### Supabase Verificatie
- ✅ Query A (global_search_index): 1 record gevonden
- ✅ Query B (security definer): 0 functies zonder search_path
- ✅ Query C (RLS): Alle 9 tabellen hebben RLS enabled

**CONCLUSIE:** Fase 0 volledig voltooid. Alle checks geslaagd.
```

### 5.2 Commit Rapport
```bash
git add docs/FASE0_DEPLOYMENT_FINAL.md
git commit -m "docs(phase0): add final verification results"
git push origin main
```

---

## STAP 6: Bevestig Voltooiing

**In deze chat, typ:**

```
Fase 0 definitief afgerond:
- 0 warnings, 0 errors
- Build & tests succesvol
- CI workflows groen (build-and-test + supabase-admin)
- Migraties en policies geverifieerd
- Rapport bijgewerkt met commit [HASH]

Klaar voor Fase 1.
```

---

## ⚠️ TROUBLESHOOTING

### Als `pnpm typecheck` errors geeft:
1. Lees de error-messages zorgvuldig
2. Fix type mismatches/imports
3. Run opnieuw tot schoon

### Als `pnpm lint` warnings geeft:
1. Run `pnpm exec eslint --fix "src/**/*.{ts,tsx}"`
2. Controleer resterende warnings handmatig
3. Remove unused imports/variables

### Als CI/CD faalt:
1. Bekijk GitHub Actions logs
2. Fix de specifieke fout (vaak database-related)
3. Push opnieuw

### Als SQL queries niet kloppen:
1. Controleer of migraties zijn uitgevoerd (supabase-admin workflow)
2. Run migraties handmatig indien nodig:
   ```bash
   supabase db push --remote
   ```

---

## 📊 SUCCESS CRITERIA

Fase 0 is **pas voltooid** als:

- [ ] `pnpm typecheck` eindigt zonder errors
- [ ] `pnpm lint --max-warnings=0` eindigt zonder warnings  
- [ ] `pnpm build:prod` slaagt zonder meldingen
- [ ] Git push succesvol naar main-branch
- [ ] GitHub Actions workflows beide groen (✅)
- [ ] Supabase SQL verificaties alle ✅
- [ ] Rapport `FASE0_DEPLOYMENT_FINAL.md` bijgewerkt met resultaten
- [ ] Bevestiging in chat geplaatst

**Geen pragmatische shortcuts. 100% schoon of niet klaar.**

---

**Gegenereerd:** 2025-01-21  
**Door:** Lovable AI  
**Voor:** Gebruiker Verificatie
