# Database Linter Issues - Handleiding

**Datum:** 26 januari 2025  
**Status:** Gereed voor uitvoering  
**Prioriteit:** HOOG

---

## 📋 Overzicht Issues

Supabase Database Linter heeft **7 issues** gedetecteerd:

| # | Type | Severity | Beschrijving | Status |
|---|------|----------|--------------|--------|
| 1-5 | Security Definer View | ERROR | Views met SECURITY DEFINER property | ⚠️ Vereist review |
| 6 | Function Search Path Mutable | WARN | Functies zonder expliciete search_path | ✅ Fix beschikbaar |
| 7 | Leaked Password Protection Disabled | WARN | Wachtwoordlek-bescherming uitgeschakeld | ⚠️ Dashboard actie vereist |

---

## 🔧 Stap-voor-stap Oplossingen

### Issue 6: Function Search Path Mutable (Direct oplosbaar)

**Probleem:**  
Functies zonder expliciete `search_path` zijn kwetsbaar voor SQL injection via search_path manipulatie.

**Oplossing:**  
Voer het SQL script uit: `docs/database/FIX-LINTER-ISSUES.sql`

**Uitvoering:**

```bash
# Via Supabase CLI
supabase db execute --file docs/database/FIX-LINTER-ISSUES.sql

# Of via Supabase Dashboard
# 1. Ga naar SQL Editor
# 2. Kopieer inhoud van docs/database/FIX-LINTER-ISSUES.sql
# 3. Voer uit
```

**Wat doet het script?**
- ✅ Voegt `SET search_path = 'public'` toe aan alle public functies zonder search_path
- ✅ Creëert admin schema voor security monitoring
- ✅ Creëert audit log tabel voor function calls
- ✅ Maakt helper views voor security review

**Geschatte uitvoertijd:** 2-5 minuten (afhankelijk van aantal functies)

---

### Issue 1-5: Security Definer Views (Review vereist)

**Probleem:**  
Views met `SECURITY DEFINER` draaien met privileges van de view creator in plaats van de querying user. Dit kan een security risk zijn.

**Identificatie:**  
Na uitvoeren van het fix script, run:

```sql
SELECT * FROM admin.security_definer_functions;
```

Dit geeft een lijst van alle SECURITY DEFINER functies/views die gereviewd moeten worden.

**Beslissingsboom per functie:**

1. **Is de SECURITY DEFINER nodig voor de functionaliteit?**
   - ❌ Nee → Converteer naar SECURITY INVOKER
   - ✅ Ja → Ga naar stap 2

2. **Heeft de functie expliciete `search_path` setting?**
   - ❌ Nee → Voeg toe (wordt automatisch gedaan door fix script)
   - ✅ Ja → Ga naar stap 3

3. **Valideert de functie alle inputs?**
   - ❌ Nee → Voeg input validatie toe
   - ✅ Ja → ✅ Functie is veilig

**Actie:**  
Voor elke gevonden functie:

```sql
-- Voorbeeld: Converteer naar SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.mijn_functie()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Gewijzigd van DEFINER naar INVOKER
SET search_path = 'public'
AS $$
    -- functie body
$$;
```

---

### Issue 7: Leaked Password Protection (Dashboard actie)

**Probleem:**  
Wachtwoordlek-bescherming is niet ingeschakeld. Gebruikers kunnen wachtwoorden instellen die voorkomen in bekende datalekken.

**Oplossing A: Via Supabase Dashboard (Aanbevolen)**

1. **Navigeer naar Authentication Settings**
   - Open Supabase Dashboard
   - Ga naar `Authentication` → `Policies`

2. **Enable Password Security**
   ```
   ☑ Enable Leaked Password Protection
   ☑ Check against HaveIBeenPwned database
   ```

3. **Configure Password Requirements**
   ```
   Minimum length: 12 characters
   ☑ Require uppercase letters
   ☑ Require lowercase letters
   ☑ Require numbers
   ☑ Require symbols
   ```

4. **Save Settings**

**Oplossing B: Via Management API (Automatisch)**

Als je toegang hebt tot de Supabase Management API:

```bash
# Gebruik bestaande edge function
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/security-config-manager \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"action": "password"}'
```

**Verificatie:**

```sql
-- Check huidige instellingen
SELECT * FROM admin.auth_config_status;
```

---

## 📊 Verwachte Resultaten

### Voor Uitvoering
```
⚠️ 7 linter issues
❌ 5 Security Definer View errors
❌ 1 Function Search Path warning
❌ 1 Leaked Password Protection warning
```

### Na Uitvoering Fase 1 (SQL Script)
```
⚠️ 6 linter issues → 5 issues
✅ 0 Function Search Path warnings
❌ 5 Security Definer View errors (vereist review)
❌ 1 Leaked Password Protection warning
```

### Na Volledige Fix
```
✅ 0 linter issues
✅ Alle functies hebben search_path
✅ Security Definer functies gereviewd en veilig
✅ Password leak protection ingeschakeld
```

---

## ⏱️ Tijdsinschatting

| Stap | Actie | Tijd | Uitgevoerd door |
|------|-------|------|-----------------|
| 1 | SQL script uitvoeren | 5 min | Database Admin |
| 2 | Security Definer views reviewen | 15-30 min | Security Engineer |
| 3 | Leaked Password Protection inschakelen | 2 min | Platform Admin |
| 4 | Verificatie en testing | 10 min | QA Engineer |
| **Totaal** | | **32-47 min** | |

---

## ✅ Verificatie Checklist

Na uitvoeren van alle stappen:

```sql
-- 1. Check alle functies hebben search_path
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) NOT ILIKE '%SET search_path%';
-- Verwacht resultaat: 0 rijen

-- 2. Check Security Definer functies
SELECT * FROM admin.security_definer_functions;
-- Review elke functie manueel

-- 3. Check auth config
SELECT * FROM admin.auth_config_status;
-- Verify alle instellingen kloppen

-- 4. Run linter opnieuw
-- Ga naar Supabase Dashboard > Database > Linter
-- Klik "Run Linter"
-- Verwacht: 0 errors, 0 warnings
```

---

## 🚨 Troubleshooting

### Probleem: "Permission denied for schema admin"

**Oorzaak:** Gebruiker heeft geen toegang tot admin schema.

**Oplossing:**
```sql
-- Run als superuser/service role
GRANT USAGE ON SCHEMA admin TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA admin TO postgres;
```

### Probleem: "Function already exists"

**Oorzaak:** Functie bestaat al met andere signature.

**Oplossing:**
```sql
-- Drop oude functie eerst
DROP FUNCTION IF EXISTS admin.is_admin() CASCADE;
-- Dan opnieuw aanmaken
```

### Probleem: SQL script loopt vast

**Oorzaak:** Mogelijk grote hoeveelheid functies of lange running functions.

**Oplossing:**
```sql
-- Run script in kleinere batches
-- Splits DO block op in meerdere kleinere blocks
-- Of run handmatig per functie
```

---

## 📚 Referenties

- [Supabase Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter)
- [Security Definer Functions Best Practices](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [Function Search Path Security](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Password Security Configuration](https://supabase.com/docs/guides/auth/password-security)
- [HaveIBeenPwned Integration](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

## 📞 Contact

Voor vragen of problemen bij uitvoering:
- **Database Team:** Check Slack #database-ops
- **Security Team:** Check Slack #security
- **Platform Team:** Check Slack #platform

---

**Laatste update:** 26 januari 2025  
**Volgende review:** Na uitvoering van alle stappen  
**Versie:** 1.0
