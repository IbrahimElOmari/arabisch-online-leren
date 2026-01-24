# 🚨 Incident Response Runbook

**Versie:** 1.0  
**Laatst bijgewerkt:** 2026-01-24  
**Eigenaar:** Platform Engineering Team

---

## Inhoudsopgave

1. [Incident Classificatie](#incident-classificatie)
2. [Escalatiematrix](#escalatiematrix)
3. [Response Procedures](#response-procedures)
4. [Rollback Procedures](#rollback-procedures)
5. [Communicatie Templates](#communicatie-templates)
6. [Post-Incident Checklist](#post-incident-checklist)

---

## Incident Classificatie

### Severity Levels

| Level | Naam | Definitie | Response Tijd | Escalatie |
|-------|------|-----------|---------------|-----------|
| **P0** | Kritiek | Platform volledig onbereikbaar, data loss, security breach | <15 min | Onmiddellijk |
| **P1** | Hoog | Core functionaliteit defect (login, lessen, betalingen) | <30 min | Binnen 1 uur |
| **P2** | Medium | Belangrijke feature defect, performance degradatie | <2 uur | Binnen 4 uur |
| **P3** | Laag | Minor bugs, cosmetische issues | <24 uur | Volgende werkdag |
| **P4** | Trivial | Wensen, verbeteringen | Gepland | Sprint planning |

### Symptomen per Categorie

#### 🔴 P0 - Kritieke Incidenten
- Platform retourneert 5xx errors voor >50% requests
- Database onbereikbaar of corruptie gedetecteerd
- Security breach: unauthorized access, data leak
- Betalingssysteem volledig down
- SSL certificaat verlopen
- Data loss of corruptie

#### 🟠 P1 - Hoge Prioriteit
- Login/registratie faalt voor alle gebruikers
- Lessen laden niet (content_library onbereikbaar)
- Stripe webhooks falen (betalingen niet verwerkt)
- Forum/chat volledig onbereikbaar
- Performance <10 RPS (normaal >100)
- Email notificaties volledig down

#### 🟡 P2 - Medium Prioriteit
- Specifieke pagina's laden traag (>5s)
- Partial outage (1 regio getroffen)
- Email notificaties vertraagd
- File uploads falen
- Zoekfunctie defect
- Specifieke browser niet ondersteund

#### 🟢 P3/P4 - Lage Prioriteit
- UI glitches
- Vertaalfouten
- Non-critical feature bugs
- Performance niet optimaal maar acceptabel

---

## Escalatiematrix

### On-Call Rotatie

| Dag | Primary On-Call | Secondary | Escalatie Manager |
|-----|-----------------|-----------|-------------------|
| Ma-Vr 09:00-18:00 | Dev Team Lead | Senior Developer | CTO |
| Ma-Vr 18:00-09:00 | On-Call Engineer | Dev Team Lead | CTO |
| Za-Zo (volledig) | On-Call Engineer | Dev Team Lead | CTO |

### Contactgegevens

| Rol | Bereikbaar Via | Response Verwachting |
|-----|----------------|---------------------|
| Primary On-Call | PagerDuty, Telefoon | <15 min (P0/P1) |
| Secondary On-Call | PagerDuty, Telefoon | <30 min |
| CTO | Telefoon, Email | <1 uur |
| Security Team | Security Slack Channel | <30 min (security issues) |

### Externe Contacten

| Service | Support URL | Prioriteit Lijn |
|---------|-------------|-----------------|
| Supabase | support.supabase.com | Enterprise: support@supabase.io |
| Stripe | dashboard.stripe.com/support | +1-888-926-2289 |
| Lovable | support.lovable.dev | In-app chat |
| Cloudflare | cloudflare.com/support | Enterprise ticket |

---

## Response Procedures

### P0 - Kritiek Incident Response

```
┌─────────────────────────────────────────────────────────────────┐
│                    P0 INCIDENT TIMELINE                        │
├─────────────────────────────────────────────────────────────────┤
│ 0-5 min   │ Detectie & Acknowledge                             │
│ 5-15 min  │ Triage & Initial Assessment                        │
│ 15-30 min │ Mitigation (rollback/hotfix)                       │
│ 30+ min   │ Resolution & Stabilization                         │
│ +1 hour   │ Post-Incident Communication                        │
│ +24 hours │ Post-Mortem Scheduled                              │
└─────────────────────────────────────────────────────────────────┘
```

#### Fase 1: Detectie & Alerting (0-5 min)

1. **Alert ontvangen** via:
   - Sentry error spike notification
   - UptimeRobot/Pingdom downtime alert
   - K6 threshold breach alert
   - Gebruiker melding via support

2. **Acknowledge incident** in #incidents Slack channel:
   ```
   🚨 P0 INCIDENT ACKNOWLEDGED
   Issue: [korte beschrijving]
   Impact: [geschatte users affected]
   On-call: @[naam]
   Status: INVESTIGATING
   Time: [HH:MM UTC]
   ```

3. **Start incident timer** - Alle tijden worden gelogd

#### Fase 2: Triage (5-15 min)

1. **Check system health:**
   ```bash
   # Supabase API health
   curl -I https://xugosdedyukizseveahx.supabase.co/rest/v1/
   
   # Edge functions health
   curl https://xugosdedyukizseveahx.supabase.co/functions/v1/health
   
   # Frontend accessibility
   curl -I https://arabisch-online-leren.lovable.app
   
   # Check HTTP status codes
   for url in "/" "/dashboard" "/auth" "/forum"; do
     echo "$url: $(curl -s -o /dev/null -w '%{http_code}' https://arabisch-online-leren.lovable.app$url)"
   done
   ```

2. **Review logs:**
   - **Supabase Dashboard:** Logs → Postgres/Auth/Edge Functions
   - **Sentry:** Issues → Filter by time of incident
   - **Browser Console:** Check for JS errors

3. **Identify root cause category:**
   - [ ] **Deployment** - Recent code change?
   - [ ] **Database** - Connection issues, slow queries?
   - [ ] **External Service** - Stripe, email, CDN?
   - [ ] **Infrastructure** - DNS, SSL, hosting?
   - [ ] **Security** - Attack, breach, abuse?

4. **Update Slack with findings:**
   ```
   🔍 TRIAGE UPDATE
   Root Cause: [identified/investigating]
   Category: [deployment/database/external/infra/security]
   Affected: [specific services/pages]
   Next: [planned action]
   ```

#### Fase 3: Mitigation (15-30 min)

Based on root cause, execute appropriate procedure:

| Root Cause | Action | Procedure |
|------------|--------|-----------|
| Bad deployment | Rollback | [Application Rollback](#application-rollback) |
| Database issue | Recovery | [Database Recovery](#database-recovery) |
| Security breach | Isolate | [Security Response](#security-incident-response) |
| External service | Failover | Contact vendor + enable fallback |

#### Fase 4: Resolution (30+ min)

1. Apply fix or complete rollback
2. Verify functionality restored:
   ```bash
   # Run smoke tests
   k6 run tests/loadtest.k6.js --env K6_SCENARIO=smoke
   ```
3. Monitor for 30 minutes for stability
4. Update status page to RESOLVED

#### Fase 5: Communication

1. **Internal update:** Final Slack message
2. **External update:** Status page (if downtime >15 min)
3. **Customer email:** If >1 hour or data affected

---

### P1 - High Priority Response

```
┌─────────────────────────────────────────────────────────────────┐
│                    P1 INCIDENT FLOW                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Alert Received   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ On-call Ack?      │
                    └────┬─────────┬────┘
                    No   │         │ Yes
                    (10m)│         │
              ┌──────────▼──┐   ┌──▼──────────┐
              │ Escalate to │   │ Triage      │
              │ Secondary   │   │ Issue       │
              └──────┬──────┘   └──────┬──────┘
                     │                 │
                     └────────┬────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Root Cause Found? │
                    └────┬─────────┬────┘
                    No   │         │ Yes
                    (30m)│         │
              ┌──────────▼──┐   ┌──▼──────────┐
              │ Escalate to │   │ Apply Fix   │
              │ Manager     │   │             │
              └─────────────┘   └──────┬──────┘
                                       │
                              ┌────────▼────────┐
                              │ Verify & Close  │
                              └─────────────────┘
```

---

## Rollback Procedures

### Application Rollback

#### Via Lovable Dashboard (Snelste Methode)

1. Open Lovable Dashboard: https://lovable.dev/projects/[project-id]
2. Ga naar **Version History** in sidebar
3. Identificeer laatste stabiele versie (vóór incident)
4. Klik **"Restore this version"**
5. Wacht op deployment (~2-3 minuten)
6. Verifieer via smoke tests

#### Via Git (Als Lovable Niet Bereikbaar)

```bash
# 1. Clone repository (indien nodig)
git clone https://github.com/[org]/arabisch-online-leren.git
cd arabisch-online-leren

# 2. Bekijk recente commits
git log --oneline -20

# 3. Identificeer laatste goede commit
# Zoek naar commit vóór problematische change

# 4. Revert naar specifieke commit
git revert HEAD~1  # Revert laatste commit
# OF
git revert [commit-hash]  # Revert specifieke commit

# 5. Push changes
git push origin main

# 6. Trigger deployment
# Deployment start automatisch via CI/CD
```

### Database Recovery

#### Point-in-Time Recovery (PITR)

```bash
# ⚠️ WAARSCHUWING: Dit reset de database naar een eerder punt!
# Alle data na dat punt gaat verloren.

# 1. Optioneel: Zet applicatie in maintenance mode
# Update DNS of enable maintenance page

# 2. Via Supabase Dashboard:
# - Ga naar: Database → Backups → Point-in-Time Recovery
# - Selecteer tijdstip vóór incident (max 7 dagen terug voor Pro)
# - Klik "Restore"

# 3. Via Supabase CLI (indien beschikbaar):
supabase db restore \
  --project-ref xugosdedyukizseveahx \
  --target-time "2026-01-23T10:00:00Z"

# 4. Verifieer data integriteit
psql $DATABASE_URL -c "SELECT COUNT(*) FROM profiles;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM enrollments;"

# 5. Re-enable applicatie
```

#### Migration Rollback

```bash
# 1. Check huidige migratie status
supabase db migrations list --linked

# 2. Schrijf rollback SQL (indien niet bestaat)
# Maak rollback script: supabase/migrations/rollback/[timestamp].sql

# 3. Execute rollback
psql $DATABASE_URL -f supabase/migrations/rollback/[migration].sql

# 4. Verifieer schema
supabase db diff --linked
```

### Edge Function Rollback

```bash
# 1. List deployed functions
supabase functions list --project-ref xugosdedyukizseveahx

# 2. Checkout previous version of function
cd supabase/functions
git checkout HEAD~1 -- [function-name]/

# 3. Redeploy
supabase functions deploy [function-name] \
  --project-ref xugosdedyukizseveahx

# 4. Verify function works
curl -X POST https://xugosdedyukizseveahx.supabase.co/functions/v1/[function-name] \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

---

## Security Incident Response

### Bij Vermoeden van Breach

#### STAP 1: Onmiddellijke Isolatie (0-5 min)

```bash
# 1. Roteer ALLE API keys
# Supabase Dashboard → Settings → API → Regenerate keys
# ⚠️ Dit breekt alle actieve sessies!

# 2. Invalideer alle user sessies
# Auth → Users → Select All → Revoke Sessions

# 3. Enable maintenance mode
# Zet applicatie tijdelijk offline

# 4. Block verdachte IPs (via Cloudflare)
# Security → WAF → Tools → IP Access Rules
```

#### STAP 2: Onderzoek (5-30 min)

```bash
# 1. Download audit logs
psql $DATABASE_URL -c "
  SELECT * FROM audit_log 
  WHERE created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC
" > audit_export.csv

# 2. Check auth logs voor verdachte activiteit
# Supabase Dashboard → Logs → Auth
# Filter op: failed logins, unusual IPs, bulk operations

# 3. Review postgres logs
# Supabase Dashboard → Logs → Postgres
# Zoek naar: unauthorized queries, permission denied, unusual tables

# 4. Check storage access
# Storage → Logs
# Zoek naar: bulk downloads, unauthorized access
```

#### STAP 3: Assessment

Documenteer:
- [ ] Welke data is mogelijk gecompromitteerd?
- [ ] Welke users zijn getroffen?
- [ ] Hoe lang was de breach actief?
- [ ] Wat was de attack vector?

#### STAP 4: Rapportage

**GDPR Vereisten:**
- Melding aan Autoriteit Persoonsgegevens binnen **72 uur**
- Melding aan getroffen gebruikers indien hoog risico
- Documentatie van incident en genomen maatregelen

---

## Communicatie Templates

### Internal Slack - Incident Start

```
🚨 **[P0/P1/P2] INCIDENT DECLARED**

**Issue:** [Korte beschrijving van het probleem]
**Impact:** [Geschatte aantal users / functionaliteit affected]
**Detected:** [HH:MM UTC]
**On-call:** @[naam]

**Current Status:** INVESTIGATING

**Relevant Links:**
- Sentry: [link naar error]
- Supabase Logs: [dashboard link]
- Status Page: [link]

Updates volgen in deze thread elke 15 minuten. ⏳
```

### Internal Slack - Progress Update

```
🔄 **INCIDENT UPDATE** - [HH:MM UTC]

**Status:** [INVESTIGATING / IDENTIFIED / MITIGATING / RESOLVED]
**Progress:** [Wat is er gedaan sinds laatste update]
**Next Steps:** [Volgende actie]
**ETA:** [Geschatte tijd tot resolution, indien bekend]

[Optioneel: technische details]
```

### Internal Slack - Resolution

```
✅ **INCIDENT RESOLVED** - [HH:MM UTC]

**Issue:** [Korte beschrijving]
**Duration:** [Start tijd] - [End tijd] ([X] minuten totaal)
**Root Cause:** [Technische beschrijving van de oorzaak]
**Resolution:** [Wat is gedaan om het op te lossen]

**Impact Summary:**
- Users affected: ~[X]
- Failed requests: [X]
- Data loss: [Ja/Nee - details indien ja]

**Immediate Actions Taken:**
- [Actie 1]
- [Actie 2]

**Follow-up:**
- [ ] Post-mortem scheduled: [datum/tijd]
- [ ] Preventieve maatregelen: [beschrijving]

CC: @channel
```

### External - Status Page Update (statuspage.io / custom)

#### Investigating

```
**Investigating - [Component Name]**
[Datum HH:MM UTC]

We are currently investigating [brief description of issue].

**Affected Services:** [List of affected services]
**Impact:** [Description of user impact]

Our team is actively working to resolve this issue. We will provide updates every 15 minutes.

For urgent assistance, contact support@arabischonlineleren.nl
```

#### Identified

```
**Identified - [Component Name]**
[Datum HH:MM UTC]

We have identified the cause of the issue affecting [service].

**Root Cause:** [Brief, non-technical description]
**Next Steps:** [What we're doing to fix it]
**ETA:** [Estimated time to resolution]

We apologize for any inconvenience and will update this page as soon as the issue is resolved.
```

#### Resolved

```
**Resolved - [Component Name]**
[Datum HH:MM UTC]

The issue affecting [service] has been resolved.

**Duration:** [Start time] to [End time] ([X] hours/minutes)
**Summary:** [Brief summary of what happened and the fix]

All services are now operating normally. If you continue to experience issues, please contact support@arabischonlineleren.nl.

We apologize for any inconvenience caused.
```

### External - Customer Email (Major Incident)

**Subject:** Service Update - [Datum] - [Status]

```
Beste [Naam/Klant],

We willen je informeren over een storing die ons platform heeft getroffen.

**Wat is er gebeurd:**
[Niet-technische beschrijving van het incident]

**Wanneer:**
Van [datum/tijd] tot [datum/tijd] ([totale duur])

**Impact op jou:**
[Beschrijving van wat de klant mogelijk heeft ervaren]

**Jouw data:**
[Bevestiging dat data veilig is, OF beschrijving van acties die nodig zijn]

**Wat we hebben gedaan:**
[Beschrijving van de oplossing]

**Wat we gaan doen:**
[Beschrijving van preventieve maatregelen voor de toekomst]

We bieden onze oprechte excuses aan voor het ongemak dat dit heeft veroorzaakt. De betrouwbaarheid van ons platform heeft de hoogste prioriteit en we nemen deze incidenten zeer serieus.

Als je vragen hebt, kun je contact met ons opnemen via:
- Email: support@arabischonlineleren.nl
- Chat: [link naar chat]

Met vriendelijke groet,

Het Arabisch Online Leren Team

---
Je ontvangt deze email omdat je een account hebt bij Arabisch Online Leren.
```

---

## Post-Incident Checklist

### Direct Na Resolution (< 24 uur)

- [ ] Incident timeline compleet (alle acties, tijden, beslissingen)
- [ ] Alle stakeholders geïnformeerd (intern en extern)
- [ ] Monitoring verhoogd voor 24-48 uur
- [ ] Status page bijgewerkt naar RESOLVED
- [ ] Incident ticket aangemaakt in tracking system
- [ ] Post-mortem meeting ingepland (binnen 3-5 werkdagen)

### Post-Mortem Meeting (< 5 werkdagen)

**Aanwezigen:**
- On-call engineer(s)
- Team lead
- Relevante developers
- Product owner (voor grote incidenten)

**Agenda:**
1. Timeline review (15 min)
2. Root cause analysis - 5 Whys (20 min)
3. What went well / What went wrong (15 min)
4. Action items identificatie (20 min)
5. Prioritering en toewijzing (10 min)

### Post-Mortem Document

```markdown
# Post-Mortem: [Incident Titel]

**Date:** [Incident datum]
**Duration:** [Start] - [End] ([X] minuten/uren)
**Severity:** [P0/P1/P2]
**Author:** [Naam]
**Reviewers:** [Namen]

## Executive Summary
[2-3 zinnen die het incident samenvatten voor management]

## Timeline (UTC)
| Tijd | Event | Actor |
|------|-------|-------|
| HH:MM | [Event beschrijving] | [Wie/Wat] |
| HH:MM | Alert ontvangen | Sentry |
| HH:MM | Incident acknowledged | @naam |
| HH:MM | Root cause identified | @naam |
| HH:MM | Fix deployed | @naam |
| HH:MM | Incident resolved | @naam |

## Root Cause Analysis

### What happened
[Technische beschrijving van het probleem]

### 5 Whys
1. **Why** did [symptom] occur? → Because [cause 1]
2. **Why** did [cause 1] happen? → Because [cause 2]
3. **Why** did [cause 2] happen? → Because [cause 3]
4. **Why** did [cause 3] happen? → Because [cause 4]
5. **Why** did [cause 4] happen? → Because [root cause]

### Root Cause
[Definitieve root cause conclusie]

## Impact Assessment
| Metric | Value |
|--------|-------|
| Users affected | [X] |
| Failed requests | [X] |
| Revenue impact | €[X] (geschat) |
| Support tickets | [X] |
| Data affected | [Ja/Nee - details] |

## What Went Well
- [Positief punt 1]
- [Positief punt 2]
- [Positief punt 3]

## What Went Wrong
- [Probleem 1]
- [Probleem 2]
- [Probleem 3]

## Action Items

| # | Action | Priority | Owner | Deadline | Status |
|---|--------|----------|-------|----------|--------|
| 1 | [Preventieve maatregel] | High | @naam | [datum] | Open |
| 2 | [Monitoring verbetering] | Medium | @naam | [datum] | Open |
| 3 | [Documentatie update] | Low | @naam | [datum] | Open |

## Lessons Learned
[Belangrijkste inzichten en verbeterpunten voor de organisatie]

## Appendix
- [Link naar Sentry error]
- [Link naar relevante logs]
- [Screenshots indien relevant]
```

### Follow-Up (< 2 weken na incident)

- [ ] Alle action items afgerond of in sprint gepland
- [ ] Preventieve maatregelen geïmplementeerd en getest
- [ ] Runbook bijgewerkt indien nodig
- [ ] Alerting/monitoring verbeterd
- [ ] Team retrospective gehouden (indien nodig)
- [ ] Post-mortem document gearchiveerd

---

## Quick Reference

### Emergency Commands

```bash
# Check platform status
curl -I https://arabisch-online-leren.lovable.app

# Check database connectivity
psql "$DATABASE_URL" -c "SELECT 1;"

# Check active database connections
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# View recent errors (Supabase logs)
supabase logs --project-ref xugosdedyukizseveahx --type postgres --time-range 1h

# Edge function logs
supabase functions logs health --project-ref xugosdedyukizseveahx
```

### Key URLs

| Resource | URL |
|----------|-----|
| Production App | https://arabisch-online-leren.lovable.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/xugosdedyukizseveahx |
| Lovable Dashboard | https://lovable.dev/projects/[project-id] |
| Status Page | [Indien geconfigureerd] |
| Sentry | [Indien geconfigureerd] |

### Escalation Quick Reference

| Severity | Response Time | Escalate After |
|----------|---------------|----------------|
| P0 | 15 min | Immediately to manager |
| P1 | 30 min | 1 hour to manager |
| P2 | 2 hours | 4 hours to lead |
| P3 | 24 hours | Next standup |

---

*Dit document wordt minimaal elk kwartaal herzien of na elk groot incident.*

**Changelog:**
- 2026-01-24: Initial version (v1.0)
