# GDPR & Data Retention Policy

**Version**: 1.0  
**Last Updated**: 2025-12-26  
**Status**: Active

## Overview

This document outlines our GDPR compliance measures and data retention policies for the Arabisch Online Leren platform.

## 1. Data Categories

### 1.1 User Personal Data
| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Account data (name, email) | Account lifetime + 30 days | Contract performance |
| Authentication logs | 90 days | Legitimate interest |
| Profile information | Account lifetime | Consent |
| Parent contact info | Account lifetime | Legal obligation (minors) |

### 1.2 Educational Data
| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Course progress | Account lifetime + 1 year | Contract performance |
| Task submissions | 2 years after submission | Legitimate interest |
| Grades & feedback | 5 years (education law) | Legal obligation |
| Certificates | Indefinite (verification) | Legitimate interest |

### 1.3 Technical Data
| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Audit logs | 1 year | Legitimate interest |
| Analytics events | 90 days | Consent |
| Error logs | 30 days | Legitimate interest |
| Session data | Session + 24 hours | Contract performance |

## 2. User Rights (GDPR Articles 15-22)

### 2.1 Right to Access (Art. 15)
Users can request a complete export of their personal data:

```typescript
// API endpoint: POST /api/gdpr/export
await gdprService.exportUserData(userId);
```

**Response time**: Within 30 days

### 2.2 Right to Rectification (Art. 16)
Users can update their personal data through:
- Profile settings page
- Support request for restricted fields

### 2.3 Right to Erasure (Art. 17)
Users can request account deletion:

```typescript
// API endpoint: POST /api/gdpr/delete
await gdprService.deleteUserData(userId, {
  preserveEducationalRecords: true // Required by law
});
```

**Exceptions**:
- Educational records required for legal compliance
- Financial transaction records (7 years)
- Ongoing legal disputes

### 2.4 Right to Data Portability (Art. 20)
Data export available in JSON and CSV formats.

## 3. Automated Data Cleanup

### 3.1 Database Cleanup Jobs

```sql
-- Configured in data_retention_policies table
INSERT INTO data_retention_policies (table_name, retention_days, is_active) VALUES
  ('analytics_events', 90, true),
  ('audit_log', 365, true),
  ('auth_rate_limits', 7, true),
  ('user_security_sessions', 30, true);
```

### 3.2 Cleanup Trigger

```sql
-- Scheduled via pg_cron (daily at 3 AM)
SELECT cron.schedule('data-retention-cleanup', '0 3 * * *', $$
  SELECT cleanup_expired_data();
$$);
```

## 4. Consent Management

### 4.1 Consent Types
- **Required**: Essential cookies, authentication
- **Analytics**: Usage tracking, performance monitoring
- **Marketing**: Email campaigns, notifications

### 4.2 Consent Records
All consent changes are logged in `user_consents` table with:
- Timestamp
- IP address
- Consent type
- Action (granted/revoked)

## 5. Data Processing Agreements

### 5.1 Sub-processors
| Provider | Purpose | Location | DPA Status |
|----------|---------|----------|------------|
| Supabase | Database & Auth | EU/US | ✅ Signed |
| Cloudflare | CDN & Security | Global | ✅ Signed |
| Sentry | Error Tracking | EU | ✅ Signed |
| Stripe | Payments | EU | ✅ Signed |

## 6. Data Breach Procedures

### 6.1 Detection
- Real-time monitoring via Sentry
- Audit log anomaly detection
- Security alerts via alerting service

### 6.2 Response Timeline
1. **0-24h**: Assess breach scope
2. **24-72h**: Notify supervisory authority (if required)
3. **Without undue delay**: Notify affected users

### 6.3 Documentation
All breaches logged in `security_incidents` with:
- Detection timestamp
- Affected data categories
- Number of affected users
- Remediation actions

## 7. Implementation Checklist

### 7.1 Technical Measures
- [x] Encryption at rest (Supabase)
- [x] Encryption in transit (TLS 1.3)
- [x] Row Level Security (RLS)
- [x] Audit logging
- [x] Data export functionality
- [x] Data deletion functionality
- [x] Consent management UI

### 7.2 Organizational Measures
- [x] Privacy policy published
- [x] Cookie consent banner
- [x] DPA with sub-processors
- [x] Staff GDPR training
- [x] Incident response plan

## 8. Contact Information

**Data Protection Officer**:  
Email: privacy@arabischonlineleren.nl

**Supervisory Authority**:  
Autoriteit Persoonsgegevens  
https://autoriteitpersoonsgegevens.nl

## 9. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-26 | Initial documentation |
