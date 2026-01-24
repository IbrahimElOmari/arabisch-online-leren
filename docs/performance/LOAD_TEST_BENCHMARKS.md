# 📊 Load Test Benchmarks & Performance Standards

## Executive Summary

Dit document definieert de performance benchmarks voor het Arabisch Online Leren platform, gebaseerd op K6 load tests met tot **10.000 virtuele gebruikers**.

---

## Test Configuratie

### Hardware Requirements (Lokale Tests)

| Component | Minimum | Aanbevolen |
|-----------|---------|------------|
| CPU | 8 cores | 16 cores |
| RAM | 16 GB | 32 GB |
| Network | 1 Gbps | 10 Gbps |
| Disk | SSD | NVMe SSD |

### Cloud Testing (K6 Cloud)

Voor tests met >1000 VUs wordt K6 Cloud aanbevolen:
- Distributed load generators in EU-WEST-1
- Real-time monitoring dashboard
- Historische vergelijkingen

---

## Benchmark Targets

### Response Time Targets (p95)

| Endpoint | Target | Threshold | Critical |
|----------|--------|-----------|----------|
| Homepage (`/`) | <500ms | <800ms | >2000ms |
| Dashboard (`/dashboard`) | <1000ms | <2000ms | >4000ms |
| Forum (`/forum`) | <800ms | <1500ms | >3000ms |
| Leerstof (`/leerstof`) | <1000ms | <2000ms | >4000ms |
| Auth (`/auth`) | <500ms | <1000ms | >2000ms |
| API Endpoints | <100ms | <200ms | >500ms |
| Edge Functions | <300ms | <500ms | >1000ms |

### Throughput Targets

| Scenario | VUs | Target RPS | Min RPS |
|----------|-----|------------|---------|
| Normal Load | 500 | 250 | 150 |
| High Load | 2000 | 800 | 500 |
| Peak Load | 5000 | 1500 | 1000 |
| Stress (10K) | 10000 | 2500 | 1500 |

### Error Rate Thresholds

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| HTTP Failures | <0.1% | <1% | >5% |
| Timeout Rate | <0.5% | <2% | >5% |
| 5xx Errors | <0.1% | <0.5% | >1% |

---

## Test Scenarios

### 1. Smoke Test (Dagelijks - CI/CD)

```bash
k6 run tests/loadtest.k6.js --env K6_SCENARIO=smoke
```

| Parameter | Waarde |
|-----------|--------|
| Duration | 1 minuut |
| VUs | 5 |
| Doel | Basis functionaliteit valideren |
| Frequentie | Elke push naar main |

### 2. Load Test (Wekelijks)

```bash
k6 run tests/loadtest.k6.js --env K6_SCENARIO=load
```

| Parameter | Waarde |
|-----------|--------|
| Duration | 14 minuten |
| Peak VUs | 500 |
| Doel | Normale verkeerspatronen |
| Frequentie | Wekelijks (zondag 02:00 UTC) |

### 3. Stress Test (Maandelijks)

```bash
k6 run tests/loadtest.k6.js --env K6_SCENARIO=stress
```

| Parameter | Waarde |
|-----------|--------|
| Duration | 31 minuten |
| Peak VUs | 10.000 |
| Doel | Maximale capaciteit bepalen |
| Frequentie | Maandelijks |

### 4. Soak Test (Kwartaal)

```bash
k6 run tests/loadtest.k6.js --env K6_SCENARIO=soak
```

| Parameter | Waarde |
|-----------|--------|
| Duration | 60 minuten |
| Constant VUs | 1000 |
| Doel | Memory leaks detecteren |
| Frequentie | Per kwartaal |

### 5. Spike Test (Maandelijks)

```bash
k6 run tests/loadtest.k6.js --env K6_SCENARIO=spike
```

| Parameter | Waarde |
|-----------|--------|
| Spike | 100 → 10.000 VUs in 10s |
| Doel | Plotselinge verkeersstijging |
| Frequentie | Maandelijks |

---

## Running Tests

### Lokaal

```bash
# Install K6
brew install k6  # macOS
# of
sudo apt install k6  # Ubuntu

# Run specific scenario
k6 run tests/loadtest.k6.js

# Run with environment variables
k6 run tests/loadtest.k6.js \
  -e APP_URL=https://arabisch-online-leren.lovable.app \
  -e SUPABASE_URL=https://xugosdedyukizseveahx.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key
```

### CI/CD (GitHub Actions)

Smoke tests draaien automatisch bij elke push. Full load tests draaien wekelijks via `.github/workflows/k6-load-test.yml`.

### K6 Cloud

```bash
# Login to K6 Cloud
k6 login cloud

# Run in cloud (distributed)
k6 cloud tests/loadtest.k6.js
```

---

## Monitoring During Tests

### Key Metrics to Watch

1. **Response Times (p95, p99)** - Moet binnen thresholds blijven
2. **Error Rate** - Mag niet >1% zijn
3. **CPU/Memory Usage** - Supabase dashboard
4. **Active Database Connections** - Max 100 voor Pro plan
5. **Edge Function Cold Starts** - Impact op latency

### Real-time Dashboards

- **K6 Cloud:** https://app.k6.io/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/xugosdedyukizseveahx
- **Sentry:** Error tracking tijdens tests

---

## Scaling Recommendations

| Concurrent Users | Recommended Infrastructure |
|-----------------|---------------------------|
| <500 | Supabase Pro (standard) |
| 500-2000 | Supabase Pro + Read Replicas |
| 2000-5000 | Supabase Enterprise |
| 5000-10000 | Enterprise + CDN + Edge Caching |
| >10000 | Multi-region + Load Balancer |

### Bottleneck Resolution

| Bottleneck | Oplossing |
|------------|-----------|
| Database Connections | Connection pooling (PgBouncer) |
| Slow Queries | Add indexes, optimize queries |
| Static Assets | CDN (Cloudflare) |
| API Rate Limits | Caching, request batching |
| Memory | Horizontal scaling |

---

## Historical Benchmarks

| Datum | Test Type | VUs | p95 | RPS | Errors |
|-------|-----------|-----|-----|-----|--------|
| 2026-01-24 | Stress | 10000 | - | - | - |
| - | - | - | - | - | - |

*Resultaten worden automatisch toegevoegd na elke test run.*

---

## Acceptance Criteria

Een release is **performance-approved** als:

- [ ] Smoke test slaagt (0 failures)
- [ ] p95 response time <2000ms voor alle pagina's
- [ ] Error rate <1%
- [ ] Throughput >100 req/s bij 500 VUs
- [ ] Geen memory leaks gedetecteerd in soak test

---

## Troubleshooting

### Test Failures

| Symptoom | Mogelijke Oorzaak | Oplossing |
|----------|-------------------|-----------|
| High error rate | Server overload | Reduce VUs, check server logs |
| Slow responses | Database bottleneck | Check slow query log |
| Connection errors | Max connections | Increase pool size |
| Timeouts | Network issues | Check CDN, DNS |

### Contact

Bij performance issues tijdens productie:
- **On-call:** Zie incident-response.md
- **Supabase Support:** Enterprise hotline

---

*Laatst bijgewerkt: 2026-01-24*
*Versie: 1.0*
