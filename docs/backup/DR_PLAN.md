# 🔐 Disaster Recovery Plan

**Document Versie:** 1.0  
**Laatst bijgewerkt:** 2025-01-20  
**Status:** ✅ Actief  
**Owner:** Platform Team

---

## 📋 Overzicht

Dit document beschrijft het volledige disaster recovery (DR) plan voor het LearnHub platform. Het doel is om de continuïteit van de dienstverlening te waarborgen bij calamiteiten.

---

## 🎯 Recovery Doelstellingen

### RTO (Recovery Time Objective)
- **Kritieke systemen:** < 4 uur
- **Database:** < 2 uur
- **Bestandsopslag:** < 6 uur
- **Volledige platform:** < 8 uur

### RPO (Recovery Point Objective)
- **Database:** < 24 uur (dagelijkse backups)
- **Bestanden:** < 24 uur
- **Audit logs:** < 1 uur (real-time replicatie)

---

## 🗂️ Backup Strategie

### Database Backups
**Frequentie:** Dagelijks om 02:00 UTC  
**Retentie:** 30 dagen  
**Methode:** Automated GitHub Actions workflow

```yaml
# Locatie: .github/workflows/backup-database.yml
# Backup wordt uitgevoerd via pg_dump
# Opgeslagen als GitHub Actions artifacts
```

**Verificatie:**
- Weekly restore tests in staging environment
- Integrity checks na elke backup
- Automated alerting bij failures

### Bestandsopslag Backups
**Frequentie:** Dagelijks  
**Locatie:** Supabase Storage (automatische replicatie)  
**Retentie:** 30 dagen

### Configuratie Backups
**Frequentie:** Bij elke wijziging (Git)  
**Locatie:** GitHub repository  
**Retentie:** Onbeperkt (Git history)

---

## 🚨 Disaster Scenarios

### Scenario 1: Database Corruption
**Impact:** Hoog - Volledige data loss mogelijk  
**RTO:** 2 uur  
**RPO:** 24 uur

**Recovery Stappen:**
1. **Identify & Isolate** (10 min)
   - Detect corruption via monitoring
   - Isolate affected tables/databases
   - Notify stakeholders

2. **Assess Damage** (20 min)
   - Determine scope of corruption
   - Identify last known good backup
   - Calculate data loss window

3. **Prepare Restore** (30 min)
   - Download latest backup from GitHub Actions artifacts
   - Verify backup integrity: `md5sum backup.sql`
   - Create temporary restore database

4. **Execute Restore** (45 min)
   ```bash
   # Download backup
   gh run download [RUN_ID] -n database-backup-YYYYMMDD-HHMMSS
   
   # Decompress
   gunzip backup.sql.gz
   
   # Restore to staging
   psql "postgresql://[USER]:[PASSWORD]@[STAGING_HOST]:5432/[DB_NAME]" < backup.sql
   
   # Verify data integrity
   psql -c "SELECT COUNT(*) FROM critical_tables;"
   
   # If verified, restore to production
   psql "postgresql://[USER]:[PASSWORD]@[PROD_HOST]:5432/[DB_NAME]" < backup.sql
   ```

5. **Verify & Test** (30 min)
   - Run integrity checks
   - Test critical user flows
   - Verify recent transactions

6. **Resume Operations** (15 min)
   - Enable application access
   - Monitor for issues
   - Document incident

### Scenario 2: Complete Supabase Outage
**Impact:** Kritiek - Volledige platform down  
**RTO:** 6 uur  
**RPO:** 24 uur

**Recovery Stappen:**
1. **Immediate Response** (30 min)
   - Activate incident command
   - Notify users via status page
   - Contact Supabase support

2. **Assess Alternatives** (1 uur)
   - Check Supabase status page
   - Evaluate migration to backup Supabase project
   - Consider temporary read-only mode

3. **Execute Migration** (3 uur)
   ```bash
   # Create new Supabase project
   # Update environment variables
   # Restore database from backup
   # Migrate storage buckets
   # Deploy edge functions
   # Update DNS/configuration
   ```

4. **Testing & Verification** (1 uur)
   - Test all critical flows
   - Verify data integrity
   - Load testing

5. **Gradual Rollout** (30 min)
   - Enable for 10% of users
   - Monitor performance/errors
   - Full rollout if stable

### Scenario 3: Ransomware Attack
**Impact:** Kritiek - Data encryption/loss  
**RTO:** 8 uur  
**RPO:** 24 uur

**Recovery Stappen:**
1. **Containment** (1 uur)
   - Immediately disconnect affected systems
   - Revoke all API keys and access tokens
   - Block suspicious IP addresses
   - Preserve forensic evidence

2. **Assessment** (2 uur)
   - Identify attack vector
   - Determine scope of encryption
   - Check backup integrity
   - Engage security team/experts

3. **Clean Environment Preparation** (2 uur)
   - Provision new infrastructure
   - Verify backups are unaffected
   - Update all credentials
   - Apply security patches

4. **Restore from Backup** (2 uur)
   - Restore database from known-good backup
   - Restore file storage
   - Redeploy application code
   - Update configurations

5. **Security Hardening** (1 uur)
   - Enable additional security measures
   - Implement stricter access controls
   - Update firewall rules
   - Enable advanced monitoring

6. **Verification & Monitoring** (ongoing)
   - Continuous security monitoring
   - Audit log analysis
   - Incident documentation
   - Post-mortem analysis

### Scenario 4: Data Center Failure
**Impact:** Hoog - Regional outage  
**RTO:** 6 uur  
**RPO:** 24 uur

**Recovery Stappen:**
1. **Failover to Secondary Region** (2 uur)
   - Activate disaster recovery site
   - Update DNS to point to DR site
   - Restore database from latest backup

2. **Service Restoration** (2 uur)
   - Deploy application to DR region
   - Restore storage from backups
   - Test critical functionality

3. **Monitor & Optimize** (2 uur)
   - Performance monitoring
   - Capacity adjustments
   - User communication

---

## 👥 Rollen & Verantwoordelijkheden

### Incident Commander
- **Primair:** Platform Lead
- **Secundair:** DevOps Lead
- **Verantwoordelijkheden:**
  - Coordinate recovery efforts
  - Communication with stakeholders
  - Decision making authority
  - Post-incident review

### Technical Lead
- **Primair:** Senior Developer
- **Secundair:** Database Administrator
- **Verantwoordelijkheden:**
  - Execute technical recovery steps
  - Verify data integrity
  - Performance optimization
  - Documentation

### Communications Lead
- **Primair:** Product Manager
- **Secundair:** Customer Success Manager
- **Verantwoordelijkheden:**
  - User communication
  - Status page updates
  - Stakeholder notifications
  - Post-incident communication

---

## 📞 Escalatie Matrix

| **Severity** | **Response Time** | **Escalation Path** |
|--------------|-------------------|---------------------|
| **P1 (Critical)** | 15 min | On-call engineer → Team lead → CTO |
| **P2 (High)** | 1 uur | On-call engineer → Team lead |
| **P3 (Medium)** | 4 uur | Team lead → Weekly review |
| **P4 (Low)** | 24 uur | Backlog → Sprint planning |

### Contact Informatie
```
On-Call Engineer: +31-XX-XXXXXXX
Platform Lead: [email]
DevOps Lead: [email]
Supabase Support: support@supabase.com
Emergency Hotline: [number]
```

---

## 🧪 Testing & Validatie

### Quarterly DR Drills
**Frequentie:** Elk kwartaal  
**Scope:** Volledige database restore

**Checklist:**
- [ ] Download most recent backup
- [ ] Restore to staging environment
- [ ] Verify data integrity
- [ ] Test critical user flows
- [ ] Measure recovery time
- [ ] Document findings
- [ ] Update DR plan if needed

### Monthly Backup Verification
**Frequentie:** Maandelijks  
**Scope:** Sample restore tests

**Checklist:**
- [ ] Select random backup
- [ ] Restore single table
- [ ] Verify row counts
- [ ] Test data integrity
- [ ] Document results

### Continuous Monitoring
- Database backup completion alerts
- Storage backup alerts
- Integrity check failures
- Automated restore test results

---

## 📊 Metrics & Monitoring

### Key Metrics
```
- Backup Success Rate: Target > 99.5%
- Restore Test Success Rate: Target > 95%
- Mean Time To Recovery (MTTR): Target < 4 hours
- Recovery Point Actual vs Target: Track delta
```

### Dashboards
- **Backup Health:** Real-time backup status
- **Storage Usage:** Monitor backup storage consumption
- **DR Test Results:** Historical test outcomes
- **Incident Timeline:** Visual incident tracking

---

## 🔄 Continuous Improvement

### Post-Incident Review Process
1. **Within 24 hours:** Initial incident review
2. **Within 1 week:** Root cause analysis
3. **Within 2 weeks:** Action items implementation
4. **Monthly:** Review and update DR plan

### Action Items Tracking
- Document all learnings
- Update runbooks
- Improve automation
- Enhance monitoring
- Schedule follow-up reviews

---

## 📚 Appendix

### A. Backup Restore Commands

#### Database Restore
```bash
# Download backup from GitHub
gh run download [RUN_ID] -n database-backup-YYYYMMDD-HHMMSS

# Decompress
gunzip database-backup-YYYYMMDD-HHMMSS.sql.gz

# Restore
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" < database-backup-YYYYMMDD-HHMMSS.sql

# Verify
psql -c "SELECT schemaname, tablename, count(*) FROM pg_tables WHERE schemaname = 'public' GROUP BY schemaname, tablename;"
```

#### Storage Restore
```bash
# List buckets
supabase storage list

# Download bucket
supabase storage download [BUCKET_NAME] --recursive

# Restore to new project
supabase storage upload [BUCKET_NAME] ./backup/* --recursive
```

### B. Critical Configuration Files
- `.github/workflows/backup-database.yml`
- `supabase/config.toml`
- Environment variables (Secrets)
- DNS records
- CDN configuration

### C. Vendor Contacts
- **Supabase Support:** support@supabase.com
- **GitHub Support:** support@github.com
- **DNS Provider:** [contact details]
- **CDN Provider:** [contact details]

### D. Compliance & Audit
- GDPR data retention requirements: 30 days minimum
- Audit log retention: 90 days
- Backup encryption: AES-256
- Access controls: Role-based (RBAC)

---

## ✅ Plan Approval

| **Role** | **Name** | **Date** | **Signature** |
|----------|----------|----------|---------------|
| Platform Lead | [Name] | 2025-01-20 | __________ |
| DevOps Lead | [Name] | 2025-01-20 | __________ |
| CTO | [Name] | 2025-01-20 | __________ |

---

## 📝 Change Log

| **Date** | **Version** | **Changes** | **Author** |
|----------|-------------|-------------|------------|
| 2025-01-20 | 1.0 | Initial DR plan creation | Platform Team |

---

**Next Review Date:** 2025-04-20  
**Review Frequency:** Quarterly or after any major incident
