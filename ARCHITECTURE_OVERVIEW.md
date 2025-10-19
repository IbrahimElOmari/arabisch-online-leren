# Architecture Overview: Arabisch Online Leren

## System Architecture

### High-Level Architecture
```
┌─────────────────┐
│   User Browser  │
│   (React SPA)   │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  Lovable CDN    │
│  (Static Assets)│
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────┐
│  Supabase API   │←────→│  PostgreSQL  │
│  (Auth + REST)  │      │  (Database)  │
└────────┬────────┘      └──────────────┘
         │
         ↓
┌─────────────────┐
│  Edge Functions │
│  (Serverless)   │
└─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.0.7
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand 5.0.8
- **Data Fetching**: TanStack Query 5.62.13
- **Routing**: React Router DOM 7.1.1
- **Internationalization**: i18next 25.6.0
- **Charts**: Recharts 2.15.0
- **Icons**: Lucide React 0.468.0

#### Backend
- **Database**: PostgreSQL 15 (Supabase)
- **Authentication**: Supabase Auth
- **API**: Supabase PostgREST
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Edge Functions**: Deno (Supabase Functions)

#### Infrastructure
- **Hosting**: Lovable (Vercel-like platform)
- **Database Hosting**: Supabase Cloud
- **CDN**: Lovable CDN
- **Monitoring**: Sentry (error tracking)
- **Analytics**: Custom (Web Vitals + Supabase)

---

## Data Architecture

### Database Schema Overview

#### Core Tables
1. **Users & Auth**
   - `auth.users` (Supabase managed)
   - `profiles` (user metadata)
   - `user_roles` (RBAC)
   - `user_security_sessions`

2. **Classes & Levels**
   - `klassen` (classes)
   - `niveaus` (levels within classes)
   - `inschrijvingen` (enrollments)

3. **Learning Content**
   - `tasks` (assignments)
   - `task_submissions` (student submissions)
   - `vragen` (questions)
   - `antwoorden` (answers)

4. **Forum & Communication**
   - `forum_threads`
   - `forum_posts`
   - `forum_reacties` (replies)
   - `forum_likes`
   - `messages` (direct messages)

5. **Progress & Gamification**
   - `student_niveau_progress`
   - `awarded_badges`
   - `bonus_points`

6. **System & Security**
   - `audit_log`
   - `audit_logs`
   - `security_events`
   - `auth_rate_limits`
   - `content_moderation`

### Row Level Security (RLS) Pattern

All tables have RLS enabled with policies based on:
- **User ID**: Students see only their own data
- **Class Membership**: Students see data from enrolled classes
- **Teacher Ownership**: Teachers see data from their classes
- **Admin Access**: Admins see all data

**Security Functions**:
```sql
has_role(user_id, role) → boolean
is_teacher_of_class(user_id, class_id) → boolean
is_enrolled_in_class(user_id, class_id) → boolean
```

### Indexing Strategy

**Primary Indexes**:
- Foreign keys (automatic)
- Frequently queried columns (user_id, class_id, niveau_id)
- Date columns for sorting (created_at, submitted_at)

**Composite Indexes**:
- Multi-column WHERE clauses (class_id + niveau_id)
- Common JOIN combinations (student_id + task_id)

**Partial Indexes**:
- Filtered queries (WHERE status = 'published')
- Ungraded submissions (WHERE grade IS NULL)

**Full-Text Search**:
- GIN indexes on tsvector columns
- Forum posts, threads, tasks

---

## Application Architecture

### Frontend Structure
```
src/
├── components/       # React components
│   ├── ui/          # Reusable UI components (shadcn)
│   ├── admin/       # Admin-specific components
│   ├── dashboard/   # Dashboard components
│   ├── forum/       # Forum components
│   ├── tasks/       # Task management
│   └── ...
├── hooks/           # Custom React hooks
├── services/        # API service layer (NEW)
│   ├── forumService.ts
│   ├── classService.ts
│   ├── taskService.ts
│   └── ...
├── contexts/        # React contexts
├── pages/           # Page components (routes)
├── utils/           # Utility functions
├── lib/             # Third-party integrations
└── integrations/    # Supabase integration
    └── supabase/
        ├── client.ts
        └── types.ts
```

### Service Layer Pattern

**Problem**: Supabase queries scattered throughout components  
**Solution**: Centralized service layer

**Example**:
```typescript
// ❌ Before: Direct Supabase call in component
const { data } = await supabase
  .from('forum_posts')
  .select('*')
  .eq('thread_id', threadId);

// ✅ After: Service layer abstraction
import { fetchForumPosts } from '@/services/forumService';
const posts = await fetchForumPosts(threadId);
```

**Benefits**:
- Consistent error handling
- Easier testing (mock service layer)
- Type safety
- Single source of truth for queries
- Easier refactoring

### State Management

**Local State**: `useState` for component-level state  
**Global State**: Zustand stores for:
- `useClassStore` - Current class selection
- `useLevelStore` - Current level selection
- `useForumStore` - Forum state (rooms, threads)
- `useTaskStore` - Task list state
- `useStudentStore` - Student dashboard state

**Server State**: TanStack Query for:
- Data fetching from Supabase
- Caching
- Invalidation
- Optimistic updates

### Routing Structure
```
/                    → Landing page
/auth                → Login/Register
/dashboard           → Main dashboard (role-based)
/klassen/:id         → Class detail
/niveaus/:id         → Level detail
/taken/:id           → Task detail
/forum               → Forum (class-based)
/forum/:threadId     → Forum thread
/admin               → Admin panel (admin only)
/admin/users         → User management
/admin/audit         → Audit logs
/profile             → User profile
/settings            → User settings
```

---

## Security Architecture

### Authentication Flow
```
User → Supabase Auth → JWT Token → RLS Policies → Data Access
```

### RBAC Implementation

**Roles**:
- `leerling` (Student)
- `leerkracht` (Teacher)
- `admin` (Administrator)

**Storage**: `user_roles` table (separate from profiles)

**Enforcement**:
1. **Frontend**: Route guards (`<ProtectedRoute>`)
2. **Backend**: RLS policies + security definer functions
3. **Edge Functions**: Role checks via `has_role()`

### Security Layers

1. **Network Layer**:
   - HTTPS only
   - CORS headers
   - Rate limiting (5 login attempts per 15 min)

2. **Application Layer**:
   - Input validation (zod schemas)
   - XSS prevention (React automatic escaping)
   - CSRF protection (Supabase tokens)

3. **Database Layer**:
   - RLS policies on all tables
   - No public tables
   - Security definer functions for role checks

4. **Monitoring Layer**:
   - Audit logging (all sensitive operations)
   - Security events table
   - Sentry error tracking

### Data Privacy

**PII Protection**:
- Emails stored in auth.users (Supabase managed)
- No email logging in console/errors
- Sentry: mask all text, block all media
- GDPR tools: Data export, data deletion

**Content Security Policy**:
```html
default-src 'self';
script-src 'self' 'unsafe-inline';
connect-src 'self' *.supabase.co;
img-src 'self' data: blob:;
frame-ancestors 'none';
```

---

## Performance Architecture

### Caching Strategy

**Browser Cache**:
- Static assets: 1 year (cache-control)
- API responses: Per TanStack Query config

**Query Cache** (TanStack Query):
- Stale time: 5 minutes (most queries)
- GC time: 10 minutes
- Refetch: On window focus (disabled)

**Future: Redis Cache**:
- Hot queries (class list, levels)
- TTL: 5 minutes
- Invalidation: On mutations

### Database Optimization

**Connection Pooling**:
- Supabase managed pool
- Max connections: 100 (default)
- Timeout: 30 seconds

**Query Optimization**:
- Indexes on all foreign keys
- Composite indexes for common queries
- Partial indexes for filtered queries
- Pagination (limit + range)

### Bundle Optimization

**Code Splitting**:
- Route-based (React Router lazy loading)
- Component-based (React.lazy)

**Tree Shaking**:
- Vite automatic tree shaking
- Import only used components

**Asset Optimization**:
- Images: WebP format (future)
- Icons: Lucide React (SVG)
- Fonts: System fonts (fallback)

**Bundle Size Targets**:
- JS: < 1 MB (compressed)
- CSS: < 100 KB (compressed)
- Total: < 1.2 MB

### Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP    | < 2.5s | 2.5s - 4s      | > 4s |
| FID    | < 100ms | 100ms - 300ms | > 300ms |
| CLS    | < 0.1  | 0.1 - 0.25     | > 0.25 |
| FCP    | < 1.8s | 1.8s - 3s      | > 3s |
| TTFB   | < 800ms | 800ms - 1.8s  | > 1.8s |

---

## Deployment Architecture

### CI/CD Pipeline
```
Git Push → GitHub Actions → Build → Test → Deploy → Verify
```

**GitHub Actions Workflow**:
1. Lint (ESLint)
2. Type check (TypeScript)
3. Unit tests (Vitest)
4. E2E tests (Playwright)
5. Build (Vite)
6. Bundle size check
7. Deploy (Lovable)

**Deployment Environments**:
- **Development**: Local (pnpm dev)
- **Staging**: Lovable preview (develop branch)
- **Production**: Lovable production (main branch)

### Database Migrations

**Process**:
1. Create migration file: `supabase/migrations/YYYYMMDD_description.sql`
2. Test locally: Supabase CLI
3. Apply to staging: Supabase Dashboard → SQL Editor
4. Verify: Test queries
5. Apply to production: Supabase Dashboard → SQL Editor

**Rollback**:
- Create reverse migration
- Apply via SQL Editor
- Update application code if needed

### Monitoring & Observability

**Error Tracking** (Sentry):
- Frontend errors
- Performance tracking (10% sample)
- Session replay (10% sample, 100% on errors)
- Breadcrumbs for debugging

**Analytics** (Custom):
- Web Vitals → `analytics_events` table
- User events → `analytics_events` table
- Custom metrics → `analytics_events` table

**Database Monitoring** (Supabase):
- Query performance (pg_stat_statements)
- Connection pool usage
- Slow query logs
- Error logs

---

## Scalability Considerations

### Current Limits
- Database: 500 MB (Supabase free tier)
- Concurrent connections: 100
- Edge function executions: 500k/month
- Storage: 1 GB

### Scaling Strategies

**Horizontal Scaling**:
- Edge functions (serverless, auto-scale)
- CDN (Lovable automatic)

**Vertical Scaling**:
- Upgrade Supabase plan (Pro: 8 GB DB, 200 connections)
- Dedicated PostgreSQL instance

**Database Scaling**:
- Read replicas (Supabase Pro+)
- Connection pooling (PgBouncer)
- Query optimization (indexes, materialized views)

**Caching**:
- Redis for hot data
- Browser cache (service worker)
- CDN cache (static assets)

### Load Testing Targets
- **Concurrent users**: 1,000
- **Requests per second**: 100
- **Database connections**: < 80% utilization
- **Response time (p95)**: < 500ms
- **Error rate**: < 0.5%

---

## Future Enhancements

### Planned Features
1. **Caching Layer**: Redis integration
2. **PWA**: Offline support, install prompt
3. **Mobile App**: React Native (code sharing)
4. **Video Streaming**: Cloudflare Stream integration
5. **Advanced Analytics**: Looker/Metabase dashboard

### Technical Debt
1. TypeScript errors: Reduce from 150 → 0
2. Test coverage: Increase from 50% → 80%
3. Bundle size: Reduce from 842KB → 700KB
4. Documentation: API docs, component storybook

---

## Design Decisions

### Why Supabase?
- **Pros**: Fast setup, built-in auth, real-time, generous free tier
- **Cons**: Vendor lock-in, limited customization
- **Alternative considered**: Custom Node.js + PostgreSQL

### Why React?
- **Pros**: Large ecosystem, good for SPA, team familiarity
- **Cons**: Bundle size, SEO challenges
- **Alternative considered**: Next.js (SSR), SvelteKit

### Why TanStack Query?
- **Pros**: Best-in-class data fetching, caching, devtools
- **Cons**: Learning curve
- **Alternative considered**: SWR, Apollo Client

### Why Zustand?
- **Pros**: Minimal boilerplate, TypeScript-first, small bundle
- **Cons**: Less ecosystem than Redux
- **Alternative considered**: Redux Toolkit, Jotai

---

## Glossary

- **RLS**: Row Level Security (PostgreSQL feature)
- **RBAC**: Role-Based Access Control
- **JWT**: JSON Web Token (authentication)
- **CSP**: Content Security Policy
- **LCP**: Largest Contentful Paint (Core Web Vital)
- **FID**: First Input Delay (Core Web Vital)
- **CLS**: Cumulative Layout Shift (Core Web Vital)
- **TTL**: Time To Live (cache expiration)
- **GC**: Garbage Collection (cache cleanup)

---

**Last Updated**: 2025-01-16  
**Document Owner**: Development Team  
**Next Review**: 2025-02-16
