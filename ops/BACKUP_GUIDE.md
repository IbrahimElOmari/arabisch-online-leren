# Backup Guide

Dit document beschrijft hoe database backups worden beheerd in Arabisch Online Leren.

## Overzicht

Het backup systeem in de applicatie is een **registry-based** systeem. Dit betekent dat:
- De app registreert backup jobs in de database
- Daadwerkelijke database dumps worden extern uitgevoerd
- Backup artifacts worden handmatig geüpload en gekoppeld

## Backup Job Workflow

### 1. Backup Job Aanmaken
Via het admin dashboard (`/admin/operations`):
1. Klik op "Nieuwe Backup"
2. Voer een notitie in (optioneel)
3. Job wordt aangemaakt met status "queued"

### 2. Database Dump Uitvoeren (Extern)

```bash
# Verbind met Supabase database
pg_dump "postgresql://user:password@host:port/database" \
  --format=custom \
  --compress=9 \
  --no-privileges \
  --no-owner \
  --file=backup_$(date +%Y%m%d_%H%M%S).dump

# Of voor SQL formaat:
pg_dump "postgresql://user:password@host:port/database" \
  --format=plain \
  --no-privileges \
  --no-owner \
  --file=backup_$(date +%Y%m%d_%H%M%S).sql
```

**Belangrijke opties:**
- `--no-privileges`: Voorkom permission issues bij restore
- `--no-owner`: Voorkom ownership issues
- `--compress=9`: Maximale compressie voor custom format

### 3. Artifact Uploaden

Upload de backup naar een van deze locaties:
- **Supabase Storage**: `storage.supabase.com/v1/object/backups/`
- **Amazon S3**: Voor langetermijn opslag
- **Google Cloud Storage**: Alternatief
- **Externe server**: Via FTP/SFTP

### 4. Job Bijwerken

In het admin dashboard:
1. Ga naar "Backup Jobs"
2. Vind je job in de lijst
3. Klik "Update"
4. Voer de artifact URL in
5. Zet status naar "success" of "failed"

## Automatisering (Toekomst)

Voor geautomatiseerde backups kun je een cron job instellen:

```bash
#!/bin/bash
# /etc/cron.daily/supabase-backup

BACKUP_DIR="/var/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DATE}.dump"

# Maak backup
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-privileges \
  --no-owner \
  --file="${BACKUP_DIR}/${FILENAME}"

# Upload naar cloud storage (voorbeeld voor AWS S3)
aws s3 cp "${BACKUP_DIR}/${FILENAME}" "s3://your-backup-bucket/supabase/"

# Update backup job via API
curl -X POST "https://your-app.supabase.co/functions/v1/admin-ops" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"update_backup_job\",
    \"job_id\": \"$JOB_ID\",
    \"status\": \"success\",
    \"artifact_url\": \"s3://your-backup-bucket/supabase/${FILENAME}\"
  }"
```

## Restore Procedures

### Van Custom Format (.dump)
```bash
pg_restore \
  --host=your-host \
  --port=5432 \
  --username=postgres \
  --dbname=new_database \
  --no-privileges \
  --no-owner \
  backup.dump
```

### Van SQL Format (.sql)
```bash
psql "postgresql://user:password@host:port/database" < backup.sql
```

## Retentiebeleid

**Aanbevolen schema:**
- **Dagelijks**: 7 dagen bewaren
- **Wekelijks**: 4 weken bewaren  
- **Maandelijks**: 12 maanden bewaren
- **Jaarlijks**: 3-7 jaar bewaren (compliance)

## Monitoring

Monitor backup status via:
- Admin dashboard: `/admin/operations`
- Database query: `SELECT * FROM backup_jobs ORDER BY created_at DESC`
- Alerts instellen voor gefaalde jobs

## Beveiliging

**Belangrijk:**
- Backup files bevatten gevoelige data
- Gebruik encrypted storage
- Beperk toegang tot backup artifacts
- Roteer database credentials regelmatig
- Test restore procedures periodiek

## Troubleshooting

**Veel voorkomende problemen:**

1. **Connection timeout**: Verhoog timeout waarden
2. **Permission denied**: Check database permissions
3. **Disk space**: Monitor beschikbare ruimte
4. **Large databases**: Gebruik parallel dumps (`--jobs=N`)

Voor support: check Supabase documentatie of neem contact op met het development team.