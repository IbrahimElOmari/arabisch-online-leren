# Automated Database Backups

**Status:** ✅ Implemented  
**Datum:** 2025-01-20

## Overzicht

Geautomatiseerde database backups draaien dagelijks via GitHub Actions. Backups worden opgeslagen als GitHub Artifacts en gelogd in de `backup_jobs` tabel.

## Backup Schedule

- **Frequency:** Daily
- **Time:** 2:00 AM UTC (3:00 AM CET)
- **Retention:** 30 dagen
- **Format:** PostgreSQL custom format (.dump), gecomprimeerd met gzip

## Backup Workflow

### GitHub Actions Workflow

**File:** `.github/workflows/backup-database.yml`

**Steps:**
1. **Setup:** Installeer PostgreSQL client
2. **Backup:** Run `pg_dump` met secure settings
3. **Compress:** Gzip compressie voor storage efficiency
4. **Upload:** Upload naar GitHub Artifacts (30 dagen retention)
5. **Log:** Log backup status in `backup_jobs` tabel
6. **Cleanup:** Verwijder backups ouder dan 30 dagen

### Manual Backup

Je kunt ook handmatig een backup triggeren:

1. Ga naar GitHub Actions tab
2. Selecteer "Database Backup" workflow
3. Click "Run workflow"
4. Backup wordt uitgevoerd en opgeslagen

## Backup Options

### pg_dump Instellingen

```bash
pg_dump \
  --host=aws-0-eu-central-1.pooler.supabase.com \
  --port=6543 \
  --username=postgres.xugosdedyukizseveahx \
  --dbname=postgres \
  --format=custom \          # Custom format voor restore flexibility
  --no-owner \               # Security: geen owner info
  --no-privileges \          # Security: geen privilege info
  --file=backup.dump
```

**Format Opties:**
- `--format=custom` - Compressed binary format (aanbevolen)
- `--format=plain` - SQL script (leesbaar, groter)
- `--format=directory` - Directory met parallelisatie support

## Restore Procedures

### Restore from GitHub Artifacts

1. **Download Backup:**
   ```bash
   # Download artifact from GitHub Actions
   gh run download <run-id> -n database-backup-<timestamp>
   ```

2. **Decompress:**
   ```bash
   gunzip backup_<timestamp>.sql.gz
   ```

3. **Restore:**
   ```bash
   pg_restore \
     --host=aws-0-eu-central-1.pooler.supabase.com \
     --port=6543 \
     --username=postgres.xugosdedyukizseveahx \
     --dbname=postgres \
     --clean \
     --if-exists \
     backup_<timestamp>.sql
   ```

### Restore Specific Tables

```bash
pg_restore \
  --host=<host> \
  --port=6543 \
  --username=<username> \
  --dbname=postgres \
  --table=users \
  --table=profiles \
  backup_<timestamp>.sql
```

## Monitoring

### Backup Status

Check backup status in Supabase dashboard:

```sql
SELECT 
  status,
  created_at,
  finished_at,
  artifact_url,
  note
FROM backup_jobs
ORDER BY created_at DESC
LIMIT 10;
```

### GitHub Actions

- **Success:** Green checkmark in Actions tab
- **Failure:** Email notificatie + red X in Actions
- **Logs:** Click op workflow run voor details

## Security

### Secrets Management

**Required GitHub Secrets:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin)
- `SUPABASE_DB_PASSWORD` - Database password voor pg_dump

**Setup:**
1. Ga naar GitHub repo → Settings → Secrets
2. Add repository secrets
3. Never commit secrets in code!

### Access Control

- **Backups:** Alleen GitHub Actions heeft toegang
- **Artifacts:** Alleen repo collaborators kunnen downloaden
- **Restore:** Alleen admins kunnen restores uitvoeren

## Retention Policy

### GitHub Artifacts

- **Retention:** 30 dagen
- **Cleanup:** Automatisch via GitHub Actions
- **Storage:** Max 5GB per repo (check usage)

### backup_jobs Table

```sql
-- Retention policy in data_retention_policies
INSERT INTO data_retention_policies (
  table_name,
  retention_days,
  delete_field
) VALUES (
  'backup_jobs',
  90,
  'created_at'
);
```

## Troubleshooting

### Backup Failed

**Check Logs:**
1. Go to GitHub Actions → Failed workflow
2. Check "Create database backup" step
3. Common issues:
   - Database credentials incorrect
   - Network timeout
   - Disk space full

**Manual Backup:**
```bash
# Test connection
pg_dump --version

# Test database connection
psql "postgresql://postgres.xugosdedyukizseveahx:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -c "SELECT version();"

# Run manual backup
pg_dump ... (see options above)
```

### Restore Failed

**Common Issues:**
- Wrong database credentials
- Conflicting data (use `--clean`)
- Missing extensions (restore to similar Supabase project)

**Solutions:**
```bash
# Clean database first
psql ... -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Then restore
pg_restore ...
```

## Best Practices

### ✅ Do

- Monitor backup status weekly
- Test restore procedure quarterly
- Keep backups for at least 30 days
- Document restore procedures
- Encrypt sensitive backups

### ❌ Don't

- Don't store backups in public repos
- Don't commit credentials
- Don't skip backup verification
- Don't restore directly to production without testing

## Disaster Recovery

### Recovery Time Objective (RTO)

- **Target:** < 1 hour
- **Steps:**
  1. Identify failure (5 min)
  2. Download latest backup (10 min)
  3. Restore database (30 min)
  4. Verify data (15 min)

### Recovery Point Objective (RPO)

- **Target:** < 24 hours (daily backups)
- **Improvement:** Consider hourly backups for critical data

## Testing

### Backup Verification

```bash
# Monthly test
1. Download latest backup
2. Restore to test database
3. Run smoke tests
4. Verify data integrity
5. Document results
```

### Restore Test Plan

**Scenario 1: Full Database Restore**
- Restore entire database
- Verify all tables present
- Check row counts
- Test application functionality

**Scenario 2: Partial Restore**
- Restore single table
- Verify data consistency
- Check foreign key constraints
- Test dependent features

## Future Improvements

### 🚀 Planned

- **Incremental backups:** Daily incrementals, weekly full
- **Off-site storage:** AWS S3 / Azure Blob backup copies
- **Point-in-time recovery:** WAL archiving for PITR
- **Automated restore testing:** Monthly automated restore tests
- **Backup encryption:** GPG encryption for sensitive data

### 💡 Considerations

- **Multi-region backups:** Store copies in different regions
- **Backup monitoring:** Automated health checks
- **Backup notifications:** Slack/email alerts
- **Compliance:** GDPR/SOC2 backup requirements

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Supabase Backup Guide](https://supabase.com/docs/guides/platform/backups)

## Changelog

**2025-01-20:**
- ✅ Implemented GitHub Actions workflow
- ✅ Daily automated backups
- ✅ 30-day retention policy
- ✅ Logging in backup_jobs table
- ✅ Automated cleanup of old backups
- ✅ Documentation created
