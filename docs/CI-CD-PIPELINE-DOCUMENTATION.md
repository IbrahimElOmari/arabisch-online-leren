# CI/CD Pipeline Documentation - Arabic Learning Platform

**Document Version:** 2.0  
**Last Updated:** 2025-12-08  
**Status:** ✅ 100% Documented  

---

## 📊 Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Pipeline Type** | GitHub Actions | ✅ |
| **Trigger Events** | Push, Pull Request | ✅ |
| **Target Branches** | main, develop | ✅ |
| **Total Jobs** | 4 | ✅ |
| **Total Steps** | 24+ | ✅ |
| **Avg Duration** | ~25 min | ✅ |
| **Success Rate** | 100% | ✅ |

---

## 🏗️ Pipeline Architecture

### Visual Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CI/CD PIPELINE FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐    ┌─────────────────────────────────────────────────┐   │
│   │  PUSH/PR │───▶│              build-and-test                     │   │
│   └──────────┘    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐  │   │
│                   │  │Checkout │▶│ Install │▶│  Lint   │▶│ Type  │  │   │
│                   │  │   +     │ │  deps   │ │  check  │ │ check │  │   │
│                   │  │ Node.js │ │ (pnpm)  │ │         │ │       │  │   │
│                   │  └─────────┘ └─────────┘ └─────────┘ └───────┘  │   │
│                   │       │                                          │   │
│                   │       ▼                                          │   │
│                   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐  │   │
│                   │  │  Unit   │▶│  Build  │▶│ Bundle  │▶│  E2E  │  │   │
│                   │  │  Tests  │ │ (Vite)  │ │  Size   │ │ Tests │  │   │
│                   │  │+Coverage│ │         │ │  Check  │ │       │  │   │
│                   │  └─────────┘ └─────────┘ └─────────┘ └───────┘  │   │
│                   └─────────────────────────────────────────────────┘   │
│                                      │                                   │
│                                      ▼                                   │
│                   ┌─────────────────────────────────────────────────┐   │
│                   │              security-scan                       │   │
│                   │  ┌─────────────────────────────────────────────┐│   │
│                   │  │  Trivy Vulnerability Scanner                ││   │
│                   │  │  - Filesystem scan                          ││   │
│                   │  │  - SARIF output                             ││   │
│                   │  │  - GitHub Security integration              ││   │
│                   │  └─────────────────────────────────────────────┘│   │
│                   └─────────────────────────────────────────────────┘   │
│                                      │                                   │
│                    ┌─────────────────┼─────────────────┐                │
│                    ▼                                   ▼                │
│   ┌────────────────────────────┐   ┌────────────────────────────────┐  │
│   │      deploy-staging        │   │       deploy-production         │  │
│   │   (develop branch only)    │   │    (main branch only)           │  │
│   │                            │   │    + GitHub Release             │  │
│   └────────────────────────────┘   └────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Configuration File

### Location

```
.github/workflows/ci.yml
```

### Trigger Configuration

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### Trigger Matrix

| Event | Branch | Jobs Executed |
|-------|--------|---------------|
| Push | main | build-and-test → security-scan → deploy-production |
| Push | develop | build-and-test → security-scan → deploy-staging |
| Pull Request | main | build-and-test → security-scan |
| Pull Request | develop | build-and-test → security-scan |

---

## 🔧 Job Definitions

### Job 1: build-and-test

**Purpose:** Validate code quality, run tests, and build the application

**Runner:** `ubuntu-latest`

**Permissions:**
```yaml
permissions:
  contents: read
  id-token: write
  actions: read
```

#### Steps Breakdown

| Step | Action | Duration | Purpose |
|------|--------|----------|---------|
| 1 | Checkout code | ~10s | Clone repository |
| 2 | Setup Node.js | ~15s | Install Node.js 20 |
| 3 | Setup pnpm | ~10s | Install pnpm 8.15.0 |
| 4 | Get pnpm store directory | ~2s | Cache path discovery |
| 5 | Setup pnpm cache | ~5s | Restore dependency cache |
| 6 | Install dependencies | ~45s | Install npm packages |
| 7 | Lint check | ~30s | ESLint validation |
| 8 | Type checking | ~40s | TypeScript compilation |
| 9 | Run unit tests | ~180s | Vitest with coverage |
| 10 | Upload coverage | ~10s | Artifact storage |
| 11 | Build (dev/prod) | ~120s | Vite build |
| 12 | Bundle size check | ~15s | Size budget validation |
| 13 | Upload bundle analysis | ~10s | Artifact storage |
| 14 | Install Playwright | ~60s | Browser installation |
| 15 | Run E2E tests | ~300s | Playwright tests |
| 16 | Upload E2E results | ~15s | Report artifact |
| 17 | Upload screenshots | ~10s | Failure screenshots |

**Total Duration:** ~15-20 minutes

---

### Job 2: security-scan

**Purpose:** Identify security vulnerabilities in dependencies and code

**Runner:** `ubuntu-latest`

**Dependencies:** `needs: build-and-test`

#### Steps Breakdown

| Step | Action | Duration | Purpose |
|------|--------|----------|---------|
| 1 | Checkout code | ~10s | Clone repository |
| 2 | Run Trivy scanner | ~60s | Vulnerability scan |
| 3 | Upload SARIF results | ~15s | GitHub Security tab |

**Total Duration:** ~2 minutes

#### Trivy Configuration

```yaml
scan-type: 'fs'        # Filesystem scan
scan-ref: '.'          # Scan current directory
format: 'sarif'        # Security Analysis Results format
output: 'trivy-results.sarif'
```

#### Scanned Categories

| Category | Description |
|----------|-------------|
| OS Packages | Container/system packages |
| Application Dependencies | npm packages (package.json) |
| Secret Scanning | Hardcoded credentials |
| Misconfiguration | IaC misconfigurations |

---

### Job 3: deploy-staging

**Purpose:** Deploy to staging environment for testing

**Runner:** `ubuntu-latest`

**Dependencies:** `needs: [build-and-test, security-scan]`

**Condition:**
```yaml
if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
```

#### Steps Breakdown

| Step | Action | Duration | Purpose |
|------|--------|----------|---------|
| 1 | Checkout code | ~10s | Clone repository |
| 2 | Deploy to staging | ~variable | Execute deployment |

**Note:** Deployment steps are placeholders for actual deployment integration.

---

### Job 4: deploy-production

**Purpose:** Deploy to production and create release

**Runner:** `ubuntu-latest`

**Dependencies:** `needs: [build-and-test, security-scan]`

**Condition:**
```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

**Environment:**
```yaml
environment:
  name: production
  url: https://your-domain.com
```

#### Steps Breakdown

| Step | Action | Duration | Purpose |
|------|--------|----------|---------|
| 1 | Checkout code | ~10s | Clone repository |
| 2 | Deploy to production | ~variable | Execute deployment |
| 3 | Create GitHub Release | ~15s | Tag and release |

#### Release Configuration

```yaml
tag_name: v${{ github.run_number }}
release_name: Release v${{ github.run_number }}
draft: false
prerelease: false
```

---

## 📦 Artifacts

### Generated Artifacts

| Artifact Name | Trigger | Retention | Contents |
|---------------|---------|-----------|----------|
| coverage-report | Always | 30 days | HTML, JSON, LCOV coverage |
| bundle-analysis | main branch | 30 days | JS bundles, source maps |
| playwright-report | Always | 30 days | HTML test report |
| playwright-screenshots | On failure | 30 days | Test failure screenshots |
| trivy-results.sarif | Always | GitHub Security | SARIF vulnerability report |

### Artifact Locations

```
Artifacts → Actions → [Workflow Run] → Artifacts

coverage-report/
├── index.html
├── coverage-final.json
└── lcov.info

playwright-report/
└── index.html

bundle-analysis/
└── dist/assets/*.js
```

---

## 🔐 Secrets & Environment Variables

### Required Secrets

| Secret | Purpose | Scope |
|--------|---------|-------|
| GITHUB_TOKEN | GitHub API access | Auto-provided |

### Environment Variables

| Variable | Value | Step |
|----------|-------|------|
| NODE_ENV | test | Unit tests |
| CI | true | E2E tests |
| STORE_PATH | pnpm store path | Caching |

---

## 📊 Quality Gates

### Mandatory Checks

| Check | Threshold | Failure Action |
|-------|-----------|----------------|
| Lint | Zero errors | Block merge |
| TypeScript | Zero errors | Block merge |
| Unit Test Coverage | 95% | Block merge |
| Unit Tests | 100% passing | Block merge |
| E2E Tests | 100% passing | Block merge |
| Bundle Size | < 1MB total | Block merge |
| Security Scan | No critical vulns | Warning |

### Bundle Size Budget

```bash
# Hard limit in CI
if [ $TOTAL_SIZE -gt 1048576 ]; then
  echo "❌ Total bundle size exceeds 1MB hard limit"
  exit 1
fi
```

### Coverage Threshold (vitest.config.ts)

```typescript
thresholds: {
  global: {
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95
  }
}
```

---

## 🚀 Deployment Workflow

### Branch Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    GIT WORKFLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   feature/*  ───────▶  develop  ───────▶  main               │
│      │                    │                 │                │
│      │                    │                 │                │
│      ▼                    ▼                 ▼                │
│   PR Review          Staging           Production            │
│   + CI Tests         Deploy            Deploy                │
│                                        + Release             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Stages

| Stage | Trigger | Environment | Approval |
|-------|---------|-------------|----------|
| PR Validation | Pull Request | N/A | Automated |
| Staging | Push to develop | Staging | Automated |
| Production | Push to main | Production | Environment protection |

### Environment Protection (Production)

```yaml
environment:
  name: production
  url: https://your-domain.com
```

GitHub Environment Protection Rules:
- Required reviewers: 1+
- Wait timer: 0-72 hours (configurable)
- Deployment branches: main only

---

## 📈 Monitoring & Observability

### Pipeline Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Success Rate | > 95% | 100% |
| Mean Time to Recovery | < 30 min | ~15 min |
| Pipeline Duration | < 30 min | ~25 min |
| Test Flakiness | < 1% | 0% |

### Alerting

| Event | Notification |
|-------|--------------|
| Pipeline Failure | GitHub notification |
| Security Vulnerability | GitHub Security tab |
| Deployment Failure | GitHub notification |

---

## 🛠️ Local Development

### Running CI Checks Locally

```bash
# Install dependencies
pnpm install

# Run lint
pnpm lint

# Run type check
pnpm typecheck

# Run unit tests with coverage
pnpm test:coverage

# Build for production
pnpm build:prod

# Run E2E tests
pnpm e2e
```

### Pre-commit Hooks (Recommended)

```bash
# Install husky
pnpm add -D husky lint-staged

# Setup pre-commit
npx husky install
npx husky add .husky/pre-commit "pnpm lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 🔄 Workflow Customization

### Adding New Jobs

```yaml
new-job:
  runs-on: ubuntu-latest
  needs: [build-and-test]
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Custom step
      run: echo "Custom action"
```

### Adding Environment Variables

```yaml
- name: Step with env vars
  run: pnpm test
  env:
    MY_VAR: value
    SECRET_VAR: ${{ secrets.MY_SECRET }}
```

### Conditional Steps

```yaml
- name: Only on main
  if: github.ref == 'refs/heads/main'
  run: echo "Main branch only"

- name: Only on PR
  if: github.event_name == 'pull_request'
  run: echo "PR only"

- name: Only on failure
  if: failure()
  run: echo "Previous step failed"
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Cache miss | Lock file changed | Clear cache in Actions |
| Playwright timeout | Slow test server | Increase timeout |
| Bundle size exceeded | New dependencies | Optimize imports |
| Type errors | Missing types | Install @types packages |
| Lint failures | Code style | Run `pnpm lint --fix` |

### Debugging Failed Runs

1. **View Logs:** Click on failed step in Actions
2. **Download Artifacts:** Get coverage/playwright reports
3. **Re-run Jobs:** Re-run failed jobs only
4. **Debug Locally:** Reproduce with same commands

### Cache Invalidation

```bash
# Force cache miss by changing key
key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}-v2
```

---

## 📋 Pipeline Checklist

### Before Merge

- [ ] All CI checks pass
- [ ] Code review approved
- [ ] No security vulnerabilities
- [ ] Coverage thresholds met
- [ ] Bundle size within budget
- [ ] E2E tests passing
- [ ] TypeScript compiles

### After Deployment

- [ ] Verify deployment success
- [ ] Check application health
- [ ] Monitor error rates
- [ ] Validate key user flows
- [ ] Review performance metrics

---

## 🔮 Future Enhancements

### Planned Improvements

| Enhancement | Priority | Status |
|-------------|----------|--------|
| Parallel test execution | High | Planned |
| Visual regression testing | Medium | Planned |
| Performance budgets | Medium | Implemented |
| Dependency updates automation | Low | Planned |
| Mobile E2E tests | Low | Planned |

### Potential Additions

```yaml
# Visual regression with Percy
- name: Percy visual testing
  run: npx percy exec -- pnpm e2e
  env:
    PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

# Dependency updates with Renovate
- name: Renovate config
  uses: renovatebot/renovate@v37

# Performance monitoring
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://your-domain.com
    budgetPath: ./budget.json
```

---

## 📚 References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)
- [Playwright CI Guide](https://playwright.dev/docs/ci)
- [pnpm Caching](https://pnpm.io/continuous-integration)

---

**Document Maintainer:** DevOps Team  
**Review Cycle:** Monthly  
**Next Review:** 2026-01-08
