# Welcome to your Lovable project

![CI](https://github.com/IbrahimElOmari/arabisch-online-leren/actions/workflows/ci.yml/badge.svg)
![Languages](https://img.shields.io/badge/languages-NL%20%7C%20EN%20%7C%20AR-blue)
![Performance](https://img.shields.io/badge/performance-optimized-green)
![Coverage](https://img.shields.io/badge/coverage-80%25-green)
![TypeScript](https://img.shields.io/badge/typescript-strict-blue)
![Security](https://img.shields.io/badge/security-hardened-green)
![RLS](https://img.shields.io/badge/RLS-enabled-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Project info

**URL**: https://lovable.dev/projects/0e45c786-7455-4ed2-80f9-d3ea8a94e8c9

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0e45c786-7455-4ed2-80f9-d3ea8a94e8c9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & pnpm installed - [install pnpm](https://pnpm.io/installation)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
pnpm install

# Step 4: Setup environment variables (CRITICAL - zie hieronder)
cp .env.example .env
# Open .env en vul je Supabase credentials in (zie .env.example voor instructies)

# Step 5: Start the development server with auto-reloading and an instant preview.
pnpm dev
```

**Environment Setup (VEREIST)**

Dit project gebruikt environment variables voor configuratie. **Commit nooit een .env bestand met echte waarden!**

1. **Kopieer het template bestand:**
   ```sh
   cp .env.example .env
   ```

2. **Vul minimaal deze vereiste waarden in:**
   - `VITE_SUPABASE_URL`: Je Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Je Supabase anon/public key

   *Waar vind ik deze waarden?*
   - Login op [Supabase](https://app.supabase.com)
   - Selecteer je project → Settings → API
   - Kopieer "Project URL" en "anon public" key

3. **Optionele configuratie:**
   - Analytics: `VITE_PLAUSIBLE_DOMAIN` (cookieless analytics)
   - Monitoring: `VITE_SENTRY_DSN` (error tracking - prod only)
   - Payments: `VITE_STRIPE_PUBLISHABLE_KEY` (als payments enabled)

4. **Herstart development server** na wijzigingen in .env

**Security:**
- ✅ `.env.example` bevat alleen placeholders (safe to commit)
- ❌ `.env` met echte waarden staat in `.gitignore` (never commit!)
- ❌ Gebruik nooit Supabase **service_role** key client-side
- ✅ Secrets voor server-side operaties: gebruik Supabase Edge Function secrets

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Tests en CI/CD

This project includes comprehensive testing infrastructure with automated CI/CD pipelines.

### Running Tests Locally

**Unit Tests**
```sh
pnpm test              # Run tests in watch mode
pnpm test:run          # Run tests once
pnpm test:coverage     # Run tests with coverage
```

**Integration Tests**
Integration tests are included with the unit tests and mock Supabase API calls.

**End-to-End Tests**
```sh
pnpm e2e              # Run E2E tests headless
pnpm e2e:ui           # Run E2E tests with UI
pnpm e2e:ci           # Run E2E tests for CI
```

**Code Coverage**
```sh
pnpm test:coverage    # Generate coverage report
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - JSON data
- `coverage/lcov.info` - LCOV format for CI integration

### Coverage Thresholds

The project maintains a 70% minimum coverage threshold for:
- **Statements**: 70%
- **Branches**: 70% 
- **Functions**: 70%
- **Lines**: 70%

### CI/CD Workflow

The project uses GitHub Actions (`.github/workflows/ci.yml`) with the following pipeline:

**On Push/PR to main/develop:**
1. **Linting** - Code quality checks with ESLint
2. **Unit Tests** - Vitest with React Testing Library
3. **Coverage** - Generate and upload coverage reports
4. **E2E Tests** - Playwright across multiple browsers
5. **Build** - Create staging/production builds
6. **Artifacts** - Store coverage and E2E reports

**Build Environments:**
- `develop` branch → staging build
- `main` branch → production build

**Test Reports:**
- Coverage reports uploaded as CI artifacts
- Playwright HTML reports for E2E test results
- Failed test screenshots and videos for debugging

### Linting

```sh
pnpm lint             # Run ESLint checks
```

The project uses ESLint with TypeScript and React hooks rules for consistent code quality.

## Beveiliging en RBAC

### Role-Based Access Control (RBAC)

Het project gebruikt een veilige RBAC-implementatie met een aparte `user_roles` tabel:

**Architectuur:**
- Rollen worden **niet** opgeslagen in `profiles.role` (privilege escalation risico)
- Aparte `user_roles` tabel met RLS policies
- Server-side verificatie via `has_role()` RPC functie
- Client-side checks via `useUserRole()` hook

**Beschikbare rollen:**
- `admin`: Volledige toegang tot systeem, gebruikersbeheer, content management
- `leerkracht`: Toegang tot eigen klassen, lessen, taken beoordelen
- `leerling`: Toegang tot ingeschreven klassen, taken inleveren

**Database Migratie (VEREIST voor productie):**

Voer de RBAC migratie uit in Supabase Dashboard → SQL Editor:
```sql
-- Zie supabase/migrations/20250110_implement_rbac.sql
-- Creëert: user_roles tabel, has_role() functie, RLS policies
```

**Client-side gebruik:**
```typescript
import { useUserRole } from '@/hooks/useUserRole';

function AdminPanel() {
  const { isAdmin, isLoading } = useUserRole();
  
  if (isLoading) return <Loading />;
  if (!isAdmin) return <AccessDenied />;
  
  return <AdminContent />;
}
```

### Monitoring en Observability

**Sentry Error Tracking (Productie):**

Monitoring is geactiveerd in productie via `src/lib/monitoring.ts`:
- **Privacy-first**: Alle PII wordt gefilterd (emails, passwords, tokens)
- **Selective**: Alleen in productie actief (`VITE_APP_ENV=production`)
- **Configuratie**: Zet `VITE_SENTRY_DSN` in environment variables

```bash
# .env.production
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_APP_ENV=production
```

**Session Security:**
- Automatische timeout na inactiviteit (configureerbaar per environment)
- Rate limiting op auth endpoints
- Audit logging voor alle sensitieve acties

## Admin & Operations

### Admin Dashboard
Toegankelijk via `/admin` voor gebruikers met rol `admin` of `leerkracht`. Het admin dashboard biedt:

**Gebruikersbeheer (`/admin/users`)**
- Overzicht van alle gebruikers met zoek en filter functionaliteit
- Rolwijzigingen (admin/leerkracht/leerling) met audit logging
- Gebruikers activatie en deactivatie

**Content Management**
- Klassen beheer: CRUD operaties, teacher assignment
- Lessen beheer: draft → published → archived workflow  
- Taken beheer: bulk publish, status management
- Forum moderatie: pin/unpin, archiveren, soft delete

**Systeem Operaties (`/admin/operations`)**
- **Maintenance Mode**: Toggle onderhoudsmodus (toont banner voor alle gebruikers)
- **Backup Registry**: Registreer backup jobs (zie `ops/BACKUP_GUIDE.md` voor uitvoering)
- **Audit Logs**: Inzicht in alle admin acties en systeemwijzigingen

**GDPR Tools**
- Self-service privacy tools via `/account/privacy`
- Data export (JSON download van eigen gegevens)  
- Account deletion requests met audit trail

### Feature Flags
Admin functionaliteit wordt gecontroleerd door feature flags in `src/config/featureFlags.ts`:
```typescript
ENABLE_ADMIN: true,           // Admin dashboard toegang
ENABLE_MODERATION: true,      // Moderatie tools
ENABLE_BACKUPS: true,         // Backup registry
ENABLE_MAINTENANCE_MODE: false, // Onderhoudsmodus toggle
ENABLE_GDPR_TOOLS: true       // Privacy tools
```

### Beveiliging
- **RLS Policies**: Alle admin tabellen beveiligd met Row Level Security
- **Role Verification**: Dubbele controle via database functies en UI guards
- **Audit Logging**: Alle wijzigingen worden gelogd zonder PII (zie `SECURITY_NOTES.md`)
- **Feature Guards**: Edge Functions controleren feature flags en permissions

### Backup Workflow  
Het backup systeem is registry-based (geen directe DB dumps):
1. Admin maakt backup job aan via dashboard
2. Externe tools voeren daadwerkelijke pg_dump uit  
3. Artifacts worden handmatig geüpload naar storage
4. Job status wordt bijgewerkt met artifact URL

Zie `ops/BACKUP_GUIDE.md` voor gedetailleerde instructies.

### Payments (Defer Mode)
Betalingsfunctionaliteit is uitgeschakeld (`VITE_ENABLE_PAYMENTS=false`):
- Geen runtime errors zonder Stripe keys
- UI toont "Binnenkort beschikbaar" i.p.v. betaalacties  
- Services gebruiken mock implementaties
- Build/CI slaagt zonder Stripe configuratie

Voor activering zie `FASE7A_FINAL_STATUS.md`.

## 🌍 Internationalization & RTL Support

Het platform ondersteunt drie talen met volledige Right-to-Left (RTL) ondersteuning:

**Beschikbare talen:**
- 🇳🇱 **Nederlands** (NL) - Default  
- 🇬🇧 **English** (EN) - Internationaal
- 🇸🇦 **العربية** (AR) - Met volledige RTL support

**Features:**
- **Taalwissel**: Dropdown in navigatiebalk met vlaggen
- **Automatische RTL**: Arabisch activeert automatisch `dir="rtl"`
- **Persistentie**: Taalvoorkeur opgeslagen in `localStorage`
- **Synchronisatie**: i18next + RTL context werken samen
- **Vertalingen**: Alle UI-elementen vertaald via `src/translations/*.json`

**Gebruik:**
```typescript
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/contexts/RTLContext';

function MyComponent() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  
  return (
    <div className={isRTL ? 'text-right' : 'text-left'}>
      <h1>{t('welcome.title')}</h1>
    </div>
  );
}
```

**Taal toevoegen:**
1. Maak `src/translations/<lang>.json`
2. Voeg toe aan `src/lib/i18n.ts`
3. Update `LanguageSelector.tsx` met vlag

## ⚡ Performance & Scalability

Het platform is geoptimaliseerd voor 10,000+ concurrent users:

**Caching Strategy:**
- **In-memory cache**: `src/lib/cache.ts` met LRU eviction
- **React Query**: Intelligente caching (5 min stale time)
- **TTL tiers**: SHORT (30s) → MEDIUM (1m) → LONG (5m) → VERY_LONG (30m)

**Database Optimizations:**
- **22 Performance Indexes**: Op `class_id`, `user_id`, `created_at`, etc.
- **Connection Pooling**: PgBouncer (Transaction mode)
- **Query Optimization**: Selectieve column fetching, batch operations

**Web Vitals Monitoring:**
- **Real-time tracking**: LCP, FID, CLS, TTFB, INP
- **Target scores**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Analytics**: Metrics naar `analytics_events` tabel
- **Reporting**: `docs/PERFORMANCE_REPORT.md`

**Load Testing:**
- **Tool**: k6 (`tests/loadtest.k6.js`)
- **Capacity**: 10,000 virtual users
- **Thresholds**: p95 < 2s, error rate < 1%, TTFB < 800ms
- **Execution**: `k6 run --env APP_URL=<url> tests/loadtest.k6.js`

Voor activering zie `FASE7A_FINAL_STATUS.md`.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database, Auth, Edge Functions)
- **Testing**: Vitest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0e45c786-7455-4ed2-80f9-d3ea8a94e8c9) and click on Share → Publish.

Alternative deployment options are available after connecting to GitHub.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
