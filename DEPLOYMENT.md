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
npm run dev                # Start development server
npm run build:development  # Build for development

# Staging  
npm run dev:staging       # Start with staging config
npm run build:staging     # Build for staging

# Production
npm run build             # Build for production (default)
npm run dev:production    # Start with production config (testing)
```

## Environment Switching

Voor development:
```bash
cp .env.development .env
npm run dev
```

Voor staging deployment:
```bash
cp .env.staging .env
npm run build:staging
```

Voor production deployment:
```bash
cp .env.production .env  
npm run build
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