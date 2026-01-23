# Infrastructure as Code

Dit document beschrijft de infrastructuurconfiguratie voor het Arabisch Leerplatform.

## Overzicht

De infrastructuur bestaat uit:
- **Supabase**: Database, Auth, Storage, Edge Functions
- **Vercel/Lovable**: Frontend hosting
- **Cloudflare**: DNS, CDN, WAF (zie terraform/modules/cloudflare)

## Terraform Modules

### Bestaande Modules
- `terraform/modules/supabase/` - Supabase configuratie
- `terraform/modules/cloudflare/` - DNS & CDN
- `terraform/modules/edge-functions/` - Edge function deployment
- `terraform/modules/monitoring/` - Alerting & logging

## Deployment

### Prerequisites
```bash
# Supabase CLI
npm install -g supabase

# Terraform (optioneel)
brew install terraform
```

### Database Migraties
```bash
# Push migraties naar productie
supabase db push --linked

# Bekijk diff
supabase db diff --linked
```

### Edge Functions
```bash
# Deploy alle functions
supabase functions deploy --project-ref xugosdedyukizseveahx

# Deploy specifieke function
supabase functions deploy stripe-webhook
```

## Rollback Procedure

### Application
```bash
# Via Lovable: gebruik version history
# Via Vercel: vercel rollback
```

### Database
```bash
# Herstel van backup
supabase db restore --backup-id <id>
```

## Monitoring

### Logs
- Supabase Dashboard > Logs
- Edge Function logs via `supabase functions logs <name>`

### Alerts
- Configureer in `terraform/modules/monitoring/`
- Slack/PagerDuty integratie beschikbaar

## Security

- Alle secrets via Supabase Vault of environment variables
- RLS policies voor alle tabellen
- Edge functions met JWT verificatie (behalve webhooks)
