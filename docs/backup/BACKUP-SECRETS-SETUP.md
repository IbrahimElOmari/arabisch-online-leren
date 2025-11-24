# 🔐 Backup Secrets Setup Guide

## Overzicht

Dit document beschrijft stap-voor-stap hoe je de GitHub Secrets configureert voor geautomatiseerde database backups.

## Vereiste Secrets

Voor de backup workflow heb je de volgende secrets nodig:

1. **SUPABASE_URL** - De URL van je Supabase project
2. **SUPABASE_SERVICE_ROLE_KEY** - De service role key met volledige database toegang
3. **SUPABASE_DB_PASSWORD** - Het database wachtwoord

## Stap 1: Supabase Credentials Verzamelen

### 1.1 SUPABASE_URL

1. Ga naar je Supabase Dashboard: https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar **Settings** → **API**
4. Kopieer de **Project URL** (bijv. `https://abcdefghijklmno.supabase.co`)

### 1.2 SUPABASE_SERVICE_ROLE_KEY

1. In hetzelfde **Settings** → **API** scherm
2. Scroll naar **Project API keys**
3. Kopieer de **service_role** key (begint met `eyJ...`)
4. ⚠️ **LET OP**: Deze key heeft VOLLEDIGE toegang tot je database. Deel deze NOOIT publiekelijk!

### 1.3 SUPABASE_DB_PASSWORD

1. Ga naar **Settings** → **Database**
2. Scroll naar **Connection String**
3. Klik op **Show** bij het wachtwoord
4. Kopieer het database wachtwoord
5. Als je het wachtwoord niet meer weet, kun je het resetten via **Reset database password**

## Stap 2: GitHub Secrets Configureren

### 2.1 Navigeer naar Repository Settings

1. Ga naar je GitHub repository
2. Klik op **Settings** (tabblad bovenaan)
3. In het linkermenu, ga naar **Secrets and variables** → **Actions**

### 2.2 Secrets Toevoegen

Voor elk secret:

1. Klik op **New repository secret**
2. Vul de **Name** in (exact zoals hieronder):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_PASSWORD`
3. Plak de bijbehorende waarde in het **Secret** veld
4. Klik op **Add secret**

### 2.3 Verificatie

Na het toevoegen zou je deze 3 secrets moeten zien:

```
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY  
✅ SUPABASE_DB_PASSWORD
```

## Stap 3: Backup Workflow Testen

### 3.1 Handmatige Test

1. Ga naar **Actions** tabblad in je repository
2. Selecteer de workflow **Database Backup**
3. Klik op **Run workflow**
4. Selecteer de branch (meestal `main`)
5. Klik op **Run workflow** (groen)

### 3.2 Resultaat Controleren

1. Wacht tot de workflow voltooid is (groene vinkje)
2. Klik op de workflow run om details te zien
3. Controleer de logs:
   - ✅ Database backup gemaakt
   - ✅ Backup gecomprimeerd
   - ✅ Bestand geüpload als artifact
   - ✅ Oude backups verwijderd (>30 dagen)

### 3.3 Backup Downloaden

1. In de workflow run, scroll naar beneden
2. Onder **Artifacts** vind je het backup bestand
3. Formaat: `database-backup-YYYY-MM-DD-HH-MM.sql.gz`
4. Download en test de restore (zie volgende sectie)

## Stap 4: Restore Procedure Testen

### 4.1 Staging Omgeving Aanmaken

Voor veilig testen, maak eerst een staging project:

1. Ga naar Supabase Dashboard
2. Klik op **New project**
3. Naam: `[je-project]-staging`
4. Selecteer dezelfde regio als productie
5. Wacht tot project klaar is

### 4.2 Backup Downloaden en Uitpakken

```bash
# Download backup van GitHub Artifacts
# Of gebruik de backup van stap 3.3

# Uitpakken
gunzip database-backup-2025-11-24-12-00.sql.gz

# Verifieer inhoud
head -n 50 database-backup-2025-11-24-12-00.sql
```

### 4.3 Restore Uitvoeren

#### Optie A: Via Supabase SQL Editor (klein bestand)

1. Ga naar je **staging** project
2. Open **SQL Editor**
3. Upload het `.sql` bestand
4. Klik op **Run**

#### Optie B: Via psql CLI (groot bestand, aanbevolen)

```bash
# Installeer PostgreSQL client (als nog niet geïnstalleerd)
# macOS:
brew install postgresql

# Ubuntu/Debian:
sudo apt-get install postgresql-client

# Windows:
# Download van https://www.postgresql.org/download/windows/

# Restore uitvoeren
psql -h db.abcdefghijklmno.supabase.co \
     -U postgres \
     -d postgres \
     -f database-backup-2025-11-24-12-00.sql

# Wachtwoord invoeren wanneer gevraagd (SUPABASE_DB_PASSWORD)
```

### 4.4 Verificatie na Restore

1. Ga naar Supabase Dashboard (staging)
2. Open **Table Editor**
3. Controleer of alle tabellen aanwezig zijn:
   - ✅ profiles
   - ✅ modules
   - ✅ enrollments
   - ✅ support_tickets
   - ✅ etc.
4. Open een paar tabellen en controleer of data aanwezig is
5. Test een query in SQL Editor:

```sql
-- Tel aantal users
SELECT COUNT(*) FROM profiles;

-- Tel aantal tickets
SELECT COUNT(*) FROM support_tickets;

-- Recent activiteit
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;
```

### 4.5 Functionele Test

1. Update de frontend `.env` om naar staging te wijzen:
```env
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
```

2. Start de applicatie: `npm run dev`

3. Test kritieke flows:
   - ✅ Login
   - ✅ Dashboard laden
   - ✅ Support ticket aanmaken
   - ✅ Forum post plaatsen
   - ✅ Module inschrijving

4. Als alles werkt → **Restore getest! ✅**

## Stap 5: Disaster Recovery Plan Activeren

Als je een echte restore moet doen op productie:

### 5.1 Communicatie

1. **Stop alle gebruikers**:
   - Plaats maintenance mode scherm
   - Verstuur e-mail/melding naar alle users
   - Disable nieuwe registraties

2. **Informeer stakeholders**:
   - IT manager
   - Product owner
   - Klantenservice team

### 5.2 Backup Maken van Huidige Staat

Voordat je restore:

```bash
# Maak backup van huidige (mogelijk corrupte) staat
pg_dump -h db.project.supabase.co \
        -U postgres \
        -F c \
        -f pre-restore-backup-$(date +%Y%m%d-%H%M).dump \
        postgres
```

### 5.3 Restore Uitvoeren op Productie

```bash
# Restore de goede backup
psql -h db.project.supabase.co \
     -U postgres \
     -d postgres \
     -f database-backup-2025-11-24-12-00.sql
```

### 5.4 Verificatie en Activatie

1. Voer alle verificatie stappen uit (zoals bij staging)
2. Test alle kritieke flows
3. Check RLS policies: `SELECT * FROM pg_policies;`
4. Check database functies: `\df` in psql
5. Als alles OK → disable maintenance mode
6. Monitor errors in logs: `SELECT * FROM audit_log WHERE severity = 'error';`

### 5.5 Post-Restore Monitoring

Eerste 24 uur na restore:

- ✅ Check error rates (elk uur)
- ✅ Monitor database performance
- ✅ Controleer user feedback/support tickets
- ✅ Verify RLS werkt correct
- ✅ Check data integrity (random samples)

## Stap 6: Alerting Configureren

### 6.1 GitHub Actions Notifications

Voor failed backups:

**Optie A: Email Alerts**

1. Ga naar GitHub repository **Settings** → **Notifications**
2. Enable **Actions workflow failed**
3. Verifieer je email

**Optie B: Slack Integration** (aanbevolen voor teams)

1. Maak Slack webhook URL:
   - Ga naar https://api.slack.com/apps
   - Create New App → From scratch
   - App name: "Backup Alerts", workspace: je workspace
   - Add feature: **Incoming Webhooks**
   - Activate Incoming Webhooks
   - **Add New Webhook to Workspace**
   - Selecteer kanaal (bijv. `#alerts` of `#devops`)
   - Kopieer Webhook URL

2. Voeg toe als GitHub Secret:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: de webhook URL

3. Update workflow (`.github/workflows/backup-database.yml`):

```yaml
# Voeg toe aan einde van workflow:
- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "🚨 Database Backup Failed!",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Database Backup Failed!*\n\nWorkflow: ${{ github.workflow }}\nRepository: ${{ github.repository }}\nBranch: ${{ github.ref }}\n\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
            }
          }
        ]
      }
```

### 6.2 Supabase Database Alerts

1. Ga naar Supabase Dashboard → **Settings** → **Notifications**
2. Enable alerts voor:
   - ✅ Database CPU > 80%
   - ✅ Database Memory > 80%
   - ✅ Database Disk > 80%
   - ✅ API error rate > 5%

3. Stel webhooks in (optioneel):
   - Voor kritieke alerts → Slack/PagerDuty
   - Webhook URL: Slack incoming webhook

## Stap 7: Documentatie Updates

### 7.1 DR Plan Bijwerken

Update `docs/backup/DR_PLAN.md` met:
- ✅ Werkelijke backup tijden
- ✅ Geteste restore tijden
- ✅ Contact informatie
- ✅ Lessons learned van test

### 7.2 Runbook Aanmaken

Maak `docs/backup/RESTORE_RUNBOOK.md`:

```markdown
# Emergency Restore Runbook

## Quick Reference
- Last successful backup: [check GitHub Actions]
- Estimated restore time: 15-30 minutes
- RTO: 1 hour
- RPO: 24 hours

## Step-by-Step Restore
1. [ ] Activate maintenance mode
2. [ ] Notify stakeholders
3. [ ] Create backup of current state
4. [ ] Download latest backup from GitHub
5. [ ] Decompress: `gunzip backup.sql.gz`
6. [ ] Restore: `psql -h ... -f backup.sql`
7. [ ] Verify: Check tables, RLS, functions
8. [ ] Test: Critical user flows
9. [ ] Deactivate maintenance mode
10. [ ] Monitor for 24h

## Emergency Contacts
- Tech Lead: [naam] - [phone]
- DevOps: [naam] - [phone]
- On-call: [PagerDuty/phone]
```

## Verificatie Checklist

Na voltooiing van alle stappen:

- [ ] Alle 3 secrets geconfigureerd in GitHub
- [ ] Backup workflow succesvol gedraaid (handmatig test)
- [ ] Backup artifact gedownload en geverifieerd
- [ ] Staging omgeving aangemaakt
- [ ] Restore succesvol uitgevoerd op staging
- [ ] Functionele tests geslaagd op staging
- [ ] Slack/email alerting geconfigureerd
- [ ] DR Plan bijgewerkt met werkelijke tijden
- [ ] Restore Runbook aangemaakt
- [ ] Team getraind op restore procedure

## Kwartaal Review

Elke 3 maanden:

1. [ ] Test restore procedure opnieuw
2. [ ] Verify secrets nog geldig zijn
3. [ ] Update contactpersonen in DR plan
4. [ ] Review backup retention policy
5. [ ] Test alerting (trigger test failure)

## Troubleshooting

### "Authentication failed" bij restore

**Oorzaak**: Verkeerd wachtwoord of key

**Oplossing**:
1. Verify `SUPABASE_DB_PASSWORD` in GitHub Secrets
2. Reset database password in Supabase indien nodig
3. Update secret met nieuwe waarde

### "Relation already exists" tijdens restore

**Oorzaak**: Database is niet leeg

**Oplossing**:
```sql
-- Drop alle tabellen (VOORZICHTIG!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Dan restore opnieuw
```

### Backup artifact niet gevonden

**Oorzaak**: Workflow failed of artifact expired

**Oplossing**:
1. Check workflow logs voor errors
2. Verify secrets correct geconfigureerd
3. Run workflow opnieuw
4. Artifacts expiren na 90 dagen - download tijdig!

### "Permission denied" tijdens restore

**Oorzaak**: Insufficient privileges

**Oplossing**:
- Gebruik service_role key (niet anon key)
- Verify `SUPABASE_SERVICE_ROLE_KEY` correct is

## Support

Voor vragen of problemen:
- 📧 Email: devops@jouworganisatie.nl
- 💬 Slack: #devops-support
- 📞 Emergency: +31 6 1234 5678
