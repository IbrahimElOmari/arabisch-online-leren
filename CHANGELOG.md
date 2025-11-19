# Changelog

All notable changes to Arabisch Online Leren will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Version 2.12.0 – PR12: ThemeSelector + Vertalingen (2025-11-19)

#### Added
- 🎨 **ThemeSelector Component** (`src/components/profile/ThemeSelector.tsx`)
  - Interactive theme selection in Profile → Settings
  - Full i18n support (NL/EN/AR) for all UI strings
  - Radio button interface for theme selection (auto/playful/professional)
  - Real-time preview of active theme
  - Toast notifications for successful theme updates
  
- 🌍 **Profile Translations** (47 new keys)
  - Complete Dutch translations (`nl.json`)
  - Complete English translations (`en.json`)
  - Complete Arabic translations (`ar.json`)
  - Keys: statistics, history, badges, progress, achievements, etc.
  
- 🧪 **Test Suite** (`src/components/profile/__tests__/ThemeSelector.test.tsx`)
  - 8 unit tests for ThemeSelector component
  - 100% code coverage for theme switching
  - i18n translation validation tests
  - Integration tests for database persistence
  
- 📚 **Documentation**
  - Test output report (`__TEST_OUTPUT_PR12__.md`)
  - Implementation details (`docs/PR12-IMPLEMENTATION.md`)
  - Updated README with theme usage instructions

#### Changed
- 🔄 **Design Tokens** (`src/index.css`, `tailwind.config.ts`)
  - Refined `.theme-playful` styles (vibrant colors, rounded borders, playful shadows)
  - Refined `.theme-professional` styles (muted colors, subtle borders, minimal shadows)
  - Added `primary-glow`, `success`, `warning`, `info` color tokens
  - Enhanced CSS variable system for theme consistency
  
- 🎯 **Profile Page** (`src/pages/Profile.tsx`)
  - Added "Settings" tab with ThemeSelector integration
  - All profile labels now use i18n keys (`t('profile.XXX')`)
  - Consistent layout across Overview/Badges/Statistics/History/Settings tabs

#### Fixed
- 🐛 Missing translations for profile tabs (Statistics, History)
- 🐛 Hardcoded strings in ThemeSelector replaced with i18n keys
- 🐛 Theme preference persistence confirmed via Supabase integration

#### Testing
- ✅ 33/33 tests passed (100% success rate)
- ✅ 14 unit tests for AgeThemeContext
- ✅ 8 unit tests for ThemeSelector
- ✅ 8 integration tests (age-based, role-based, manual override, persistence)
- ✅ 3 performance tests (< 50ms theme switch latency)

---

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
