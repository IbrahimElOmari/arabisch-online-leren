# Changelog

All notable changes to Arabisch Online Leren will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fase 1 - Internationalisering, Prestaties & UX (2025-01-21)

#### Added
- 🌍 **English translations** (`src/translations/en.json`)
  - Full internationalization support for English speakers
  - All UI strings, roles, forms, errors translated
  - Fallback language set to English for international users
  
- ⚡ **Query caching system** (`src/lib/cache.ts`)
  - In-memory cache with LRU eviction
  - Configurable TTL per query type
  - Cache invalidation patterns (key, regex, clear all)
  - React Query integration helper
  
- 📊 **Progress tracking** (`docs/FASE1_PROGRESS.md`)
  - Detailed task breakdown for Fase 1
  - Daily progress updates
  - Blocker and risk management

#### Changed
- 🔄 **i18n configuration** (`src/lib/i18n.ts`)
  - Added English language support
  - Updated fallback language from Dutch to English
  - Improved language detection logic

#### Removed
- 🧹 **Mock data cleanup**
  - Removed `src/components/admin/AdminSeeder.tsx` (database seeding UI)
  - Removed mock progress/completion data from `AnalyticsDashboard.tsx`
  - Removed mock messages/users from `RealtimeChat.tsx`
  - Cleaned up "Mock" comments in export functionality

#### Fixed
- 🐛 Analytics dashboard now shows real student counts instead of random values
- 🐛 Chat component now properly awaits real Supabase realtime implementation

#### Pending
- 📋 3-language selector dropdown (NL/EN/AR) with flags
- 📋 Connection pooling via PgBouncer
- 📋 Performance indexes migration
- 📋 Load testing with k6
- 📋 Lighthouse audit and UX report
- 📋 Web Vitals monitoring
- 📋 Unit/E2E tests expansion

---

## [Fase 0] - Production Hardening (2025-01-20)

### Security
- ✅ RBAC implementation with `user_roles` table
- ✅ RLS policies on all tables
- ✅ Sentry error monitoring (production only)
- ✅ PII filtering in logs
- ✅ Security audit logging

### Infrastructure
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Automated tests (unit + E2E)
- ✅ Code coverage reporting (70%+ threshold)
- ✅ TypeScript strict mode
- ✅ ESLint zero-warnings policy

### Documentation
- ✅ Environment setup guide
- ✅ RBAC implementation docs
- ✅ Admin operations guide
- ✅ Backup workflow docs
- ✅ Security notes and compliance

---

## [0.1.0] - Initial Release

### Added
- Basic authentication (Supabase Auth)
- User roles (admin, leerkracht, leerling)
- Class management
- Lesson scheduling
- Forum system
- Task submissions and grading
- Arabic RTL support
- Dark mode

### Infrastructure
- React + TypeScript + Vite
- Supabase backend
- Tailwind CSS + shadcn/ui
- React Query for data fetching

---

## Links

- **Project URL**: https://lovable.dev/projects/0e45c786-7455-4ed2-80f9-d3ea8a94e8c9
- **Documentation**: See `/docs` folder
- **Issues**: Report via project management system
