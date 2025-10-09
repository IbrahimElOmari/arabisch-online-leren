# Deployment Instructies - Arabisch Online Leren

## Omgevingsstructuur

Het project is nu geconfigureerd met drie omgevingen:

| Omgeving | Status | Supabase Project | Configuratie File |
|----------|--------|------------------|-------------------|
| **Development** | ✅ Actief | xugosdedyukizseveahx.supabase.co | .env.development |
| **Staging** | ⚠️ Placeholder | YOUR_STAGING_PROJECT_ID | .env.staging |
| **Production** | ⚠️ Placeholder | YOUR_PRODUCTION_PROJECT_ID | .env.production |

## Environment Variables Setup

### Vereiste Stappen voor Staging & Production:

1. **Staging Environment:**
   ```bash
   # Maak een nieuw Supabase project aan voor staging
   # Update .env.staging met:
   VITE_SUPABASE_PROJECT_ID="staging_project_id"
   VITE_SUPABASE_URL="https://staging_project_id.supabase.co"
   VITE_SUPABASE_ANON_KEY="staging_anon_key"
   ```

2. **Production Environment:**
   ```bash
   # Maak een nieuw Supabase project aan voor production  
   # Update .env.production met:
   VITE_SUPABASE_PROJECT_ID="production_project_id"
   VITE_SUPABASE_URL="https://production_project_id.supabase.co"
   VITE_SUPABASE_ANON_KEY="production_anon_key"
   ```

## Build Commands

```bash
# Development
pnpm dev                # Start development server
pnpm build              # Build for development

# Staging  
cp .env.staging .env
pnpm build              # Build for staging

# Production
cp .env.production .env
pnpm build              # Build for production
```

## Environment Switching

Voor development:
```bash
cp .env.development .env
pnpm dev
```

Voor staging deployment:
```bash
cp .env.staging .env
pnpm build
```

Voor production deployment:
```bash
cp .env.production .env  
pnpm build
```

## RBAC Database Migratie (KRITIEK)

**STAP 1: Voer migratie uit**

Navigeer naar Supabase Dashboard → SQL Editor en voer uit:
```sql
-- Zie: supabase/migrations/20250110_implement_rbac.sql

-- Creëert:
-- 1. user_roles tabel met RLS
-- 2. has_role() security definer functie  
-- 3. Migreert bestaande rollen van profiles naar user_roles
```

**STAP 2: Verifieer migratie**

Controleer in SQL Editor:
```sql
-- Check user_roles tabel bestaat
SELECT * FROM public.user_roles LIMIT 5;

-- Test has_role() functie
SELECT public.has_role(auth.uid(), 'admin');
```

**STAP 3: Verwijder oude role kolom (optioneel)**

Pas nadat alle checks succesvol zijn:
```sql
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
```

**Waarom deze migratie?**
- **Security**: Voorkomt privilege escalation via client-side manipulatie
- **Compliance**: Scheidt authenticatie van autorisatie
- **Auditability**: Alle role-changes worden gelogd

## Service Worker Configuratie

Het project gebruikt **alleen** VitePWA voor service worker generatie:

✅ **Correct**: `vite-plugin-pwa` in `vite.config.ts`  
❌ **Verwijderd**: Handmatige `public/sw.js` (conflict opgelost)

**Offline functionaliteit:**
- PWA cache voor assets en API responses
- `/offline.html` fallback voor netwerkfouten
- Auto-update bij nieuwe deployment

**Testen:**
```bash
pnpm build && pnpm preview
# Open DevTools → Application → Service Workers
```

## Security Features per Omgeving

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| Session Timeout | 30 min | 25 min | 20 min |
| Rate Limiting | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ |
| PWA | ✅ | ✅ | ✅ |
| Offline Mode | ❌ | ❌ | ✅ |

## Volgende Stappen

1. **Staging Setup:**
   - Maak Supabase staging project aan
   - Configureer database schema (migratie vanaf development)
   - Update .env.staging met echte waarden
   - Test deployment

2. **Production Setup:**
   - Maak Supabase production project aan  
   - Configureer database schema (migratie vanaf staging)
   - Update .env.production met echte waarden
   - Setup CI/CD pipeline

3. **Security Hardening:**
   - Configureer Supabase Auth policies per omgeving
   - Setup monitoring en alerting
   - Configureer backup strategie

## Troubleshooting

### Environment Variables Not Loading:
```bash
# Check current environment
echo $NODE_ENV
echo $VITE_APP_ENV

# Verify .env file is correct
cat .env | head -5
```

### Supabase Connection Issues:
- Controleer of project URLs correct zijn
- Verificeer anon keys in Supabase dashboard
- Check network connectivity
```