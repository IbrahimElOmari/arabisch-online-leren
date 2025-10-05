# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0e45c786-7455-4ed2-80f9-d3ea8a94e8c9

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0e45c786-7455-4ed2-80f9-d3ea8a94e8c9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

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
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Run tests with UI interface
```

**Integration Tests**
Integration tests are included with the unit tests and mock Supabase API calls.

**End-to-End Tests**
```sh
npm run e2e           # Run E2E tests headless
npm run e2e:ui        # Run E2E tests with UI
npm run e2e:headed    # Run E2E tests in headed mode
```

**Code Coverage**
```sh
npm run test:coverage # Generate coverage report
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
npm run lint          # Run ESLint checks
```

The project uses ESLint with TypeScript and React hooks rules for consistent code quality.

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
