# Security Notes - Arabisch Online Leren

Dit document beschrijft belangrijke beveiligingsaspecten van de applicatie.

## Audit Logging Principes

### Data Minimalisatie
- **Geen PII in logs**: Audit logs bevatten GEEN persoonlijk identificeerbare informatie
- **Geredacteerde metadata**: Alleen essentiële, niet-gevoelige informatie wordt gelogd
- **Pseudonimisatie**: User IDs worden gebruikt i.p.v. namen/emails in log entries

### Voorbeeld Audit Entry
```json
{
  "id": "uuid",
  "actor_id": "user-uuid", 
  "action": "user_role_changed",
  "entity_type": "profile",
  "entity_id": "target-user-uuid",
  "meta": {
    "old_role": "leerling",
    "new_role": "leerkracht",
    "reason": "promoted"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2023-09-22T10:00:00Z"
}
```

**Wat NIET wordt gelogd:**
- Wachtwoorden of tokens
- Volledige namen of email adressen
- Gevoelige content (forum posts, private messages)
- Betalingsgegevens

## Row Level Security (RLS) Implementatie

### Basis Principes
- **Default Deny**: Alle tabellen hebben RLS enabled met restrictieve default policies
- **Role-based Access**: Toegang gebaseerd op `get_user_role()` functie
- **Data Isolation**: Gebruikers kunnen alleen hun eigen data zien (tenzij admin)

### Admin Area Beveiliging

**Database Level:**
```sql
-- Audit logs: alleen admins
CREATE POLICY "Admins can read audit logs"
ON audit_logs FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

-- System settings: alleen admins
CREATE POLICY "Admins manage settings"
ON system_settings FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');
```

**Application Level:**
- Admin routes zijn protected door `ProtectedRoute` component
- Role checks in `AdminLayout.tsx`
- Feature flags voor admin functionaliteit

### Edge Function Beveiliging

**Authentication Checks:**
```typescript
// JWT verificatie
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}

// Role verificatie  
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (!profile || !['admin', 'leerkracht'].includes(profile.role)) {
  return new Response('Forbidden', { status: 403 });
}
```

**Search Path Security:**
```typescript
// Voorkom SQL injection via search_path
await supabase.rpc('set_config', {
  setting_name: 'search_path',
  new_value: 'public,pg_catalog',
  is_local: true
});
```

## GDPR Compliance

### Data Subject Rights
- **Right to Access**: Export functionaliteit via `/account/privacy`
- **Right to Erasure**: Deletion request workflow
- **Right to Rectification**: Profile edit functionaliteit
- **Right to Portability**: JSON export van user data

### Data Processing
```typescript
// Alleen eigen data exporteren
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)  // Beperkt tot eigen profiel
  .single();

// PII redaction bij export
const exportData = {
  profile: {
    id: data.id,
    created_at: data.created_at,
    // Gevoelige velden weggelaten
  }
};
```

### Retention Policy
- Audit logs: 2 jaar bewaren
- User sessions: 30 dagen
- Deleted accounts: gemarkeerd, niet hard deleted (compliance)

## Rate Limiting

### Authentication
- **Login attempts**: 5 per 15 minuten per IP
- **Password reset**: 3 per uur per email
- **Account creation**: 10 per dag per IP

### API Endpoints
- **Admin operations**: 100 per minuut per user
- **GDPR exports**: 3 per dag per user
- **Forum posts**: 20 per uur per user

## Session Management

### Security Headers
```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

### Session Validation
- JWT tokens via Supabase Auth
- Automatische token refresh
- Secure cookie flags in productie

## Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' wss: https://*.supabase.co;
">
```

## Monitoring & Alerting

### Security Events
- **Failed login attempts**: Monitor via `auth_logs`
- **Privilege escalations**: Alert op role changes
- **Bulk data access**: Monitor GDPR exports
- **Admin activity**: Log alle admin acties

### Incident Response
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Review audit logs + system state  
3. **Containment**: Disable compromised accounts
4. **Recovery**: Restore from clean backups
5. **Lessons Learned**: Update security measures

## Development Security

### Code Reviews
- Security-focused PR reviews
- Automated security scanning (Snyk, SAST)
- Dependency vulnerability checks

### Testing
- Security unit tests voor RLS policies
- Penetration testing van admin endpoints  
- GDPR compliance testing

### Deployment
- Secrets management via environment variables
- Encrypted database connections
- Regular security updates

## Contact & Reporting

Voor security issues:
- **Intern team**: Gebruik private kanalen
- **Externe researchers**: [security@arabischonlineleren.nl]
- **Emergency**: Direct contact development team

**Responsible Disclosure Policy:**
- 90 dagen voor public disclosure
- Credit voor researchers (indien gewenst)
- Beloning voor kritieke vulnerabilities