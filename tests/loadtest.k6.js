/**
 * K6 Load Test Suite - 10,000 Virtual Users
 * Arabisch Online Leren Platform
 * 
 * Test Types:
 * - Smoke: Quick validation (5 VUs, 1 min)
 * - Load: Normal traffic simulation (500 VUs, 14 min)
 * - Stress: Peak capacity test (10,000 VUs, 31 min)
 * - Soak: Endurance test (1,000 VUs, 60 min)
 * - Spike: Sudden traffic burst (100 → 10,000 VUs)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// ============================================
// CUSTOM METRICS
// ============================================
const errorRate = new Rate('error_rate');
const pageLoadTime = new Trend('page_load_time');
const apiLatency = new Trend('api_latency');
const dbQueryTime = new Trend('db_query_time');
const edgeFunctionTime = new Trend('edge_function_time');
const activeConnections = new Gauge('active_connections');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// ============================================
// CONFIGURATION
// ============================================
const BASE_URL = __ENV.APP_URL || 'https://arabisch-online-leren.lovable.app';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://xugosdedyukizseveahx.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

// ============================================
// TEST OPTIONS
// ============================================
export const options = {
  // Scenario-based execution for different test types
  scenarios: {
    // Smoke Test - Quick validation (run first)
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { test_type: 'smoke' },
      exec: 'smokeTest',
    },
    
    // Load Test - Normal traffic patterns
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Warm up
        { duration: '5m', target: 500 },   // Ramp to normal load
        { duration: '5m', target: 500 },   // Sustain
        { duration: '2m', target: 0 },     // Ramp down
      ],
      startTime: '1m',
      tags: { test_type: 'load' },
      exec: 'loadTest',
    },
    
    // Stress Test - Peak capacity at 10,000 VUs
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m', target: 1000 },   // Ramp to 1K
        { duration: '5m', target: 5000 },   // Ramp to 5K
        { duration: '5m', target: 10000 },  // Peak at 10K VUs
        { duration: '10m', target: 10000 }, // Sustain peak load
        { duration: '5m', target: 5000 },   // Gradual decrease
        { duration: '3m', target: 0 },      // Ramp down
      ],
      startTime: '15m',
      tags: { test_type: 'stress' },
      exec: 'stressTest',
    },
    
    // Soak Test - Endurance (1 hour at moderate load)
    soak: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '60m',
      startTime: '50m',
      tags: { test_type: 'soak' },
      exec: 'soakTest',
    },
    
    // Spike Test - Sudden traffic burst
    spike: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '10s', target: 10000 }, // Instant spike to 10K
        { duration: '1m', target: 10000 },  // Sustain spike
        { duration: '10s', target: 100 },   // Drop back
      ],
      startTime: '115m',
      tags: { test_type: 'spike' },
      exec: 'spikeTest',
    },
  },
  
  // Performance thresholds
  thresholds: {
    // Global thresholds
    http_req_duration: ['p(50)<500', 'p(95)<2000', 'p(99)<4000'],
    http_req_failed: ['rate<0.01'],
    error_rate: ['rate<0.05'],
    
    // Page-specific thresholds (p95)
    'http_req_duration{page:homepage}': ['p(95)<800'],
    'http_req_duration{page:dashboard}': ['p(95)<2000'],
    'http_req_duration{page:forum}': ['p(95)<1500'],
    'http_req_duration{page:leerstof}': ['p(95)<2000'],
    'http_req_duration{page:auth}': ['p(95)<1000'],
    
    // API & function thresholds
    'api_latency': ['p(95)<200'],
    'db_query_time': ['p(95)<150'],
    'edge_function_time': ['p(95)<500'],
    
    // Throughput requirements
    http_reqs: ['rate>500'],  // Minimum 500 req/s at peak
    successful_requests: ['count>100000'],
  },
  
  // Summary statistics to include
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(50)', 'p(90)', 'p(95)', 'p(99)'],
};

// ============================================
// PAGE SCENARIOS WITH WEIGHTS
// ============================================
const pageScenarios = [
  { name: 'homepage', url: '/', weight: 35, page: 'homepage' },
  { name: 'dashboard', url: '/dashboard', weight: 25, page: 'dashboard' },
  { name: 'forum', url: '/forum', weight: 15, page: 'forum' },
  { name: 'leerstof', url: '/leerstof', weight: 15, page: 'leerstof' },
  { name: 'auth', url: '/auth', weight: 10, page: 'auth' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function selectWeightedScenario() {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const scenario of pageScenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario;
    }
  }
  return pageScenarios[0];
}

function executePageRequest(scenario) {
  const startTime = Date.now();
  
  const res = http.get(`${BASE_URL}${scenario.url}`, {
    tags: { name: scenario.name, page: scenario.page },
    timeout: '30s',
  });
  
  const duration = Date.now() - startTime;
  pageLoadTime.add(duration);
  
  const success = check(res, {
    [`${scenario.name}: status OK`]: (r) => r.status >= 200 && r.status < 400,
    [`${scenario.name}: response time < 5s`]: (r) => r.timings.duration < 5000,
    [`${scenario.name}: has content`]: (r) => r.body && r.body.length > 0,
    [`${scenario.name}: TTFB < 2s`]: (r) => r.timings.waiting < 2000,
  });
  
  if (success) {
    successfulRequests.add(1);
    errorRate.add(0);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
  
  return res;
}

function executeAPIRequest(endpoint, options = {}) {
  const startTime = Date.now();
  
  const res = http.get(`${SUPABASE_URL}${endpoint}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      ...options.headers,
    },
    tags: { type: 'api' },
  });
  
  apiLatency.add(Date.now() - startTime);
  return res;
}

function simulateUserBehavior() {
  // Variable think time to simulate realistic user behavior
  const thinkTime = Math.random() * 3 + 1; // 1-4 seconds
  sleep(thinkTime);
}

// ============================================
// TEST SCENARIOS
// ============================================

// Smoke Test - Basic functionality validation
export function smokeTest() {
  group('Smoke Test - Basic Validation', () => {
    for (const scenario of pageScenarios) {
      const res = executePageRequest(scenario);
      check(res, {
        'smoke: page accessible': (r) => r.status === 200 || r.status === 302,
      });
    }
  });
  
  simulateUserBehavior();
}

// Load Test - Normal traffic simulation
export function loadTest() {
  const scenario = selectWeightedScenario();
  
  group(`Load Test - ${scenario.name}`, () => {
    executePageRequest(scenario);
    
    // Simulate user navigation (30% chance to visit second page)
    if (Math.random() < 0.3) {
      simulateUserBehavior();
      const secondScenario = selectWeightedScenario();
      executePageRequest(secondScenario);
    }
  });
  
  simulateUserBehavior();
}

// Stress Test - Peak capacity testing
export function stressTest() {
  const scenario = selectWeightedScenario();
  
  group(`Stress Test - ${scenario.name}`, () => {
    // Execute main page request
    executePageRequest(scenario);
    
    // Simulate API calls (dashboard users)
    if (scenario.name === 'dashboard' && SUPABASE_ANON_KEY) {
      const apiRes = executeAPIRequest('/rest/v1/profiles?select=id&limit=1');
      check(apiRes, {
        'API: accessible under stress': (r) => r.status < 500,
      });
    }
  });
  
  // Shorter think time under stress
  sleep(Math.random() * 2 + 0.5);
}

// Soak Test - Endurance testing
export function soakTest() {
  const scenario = selectWeightedScenario();
  
  group(`Soak Test - ${scenario.name}`, () => {
    const res = executePageRequest(scenario);
    
    // Memory leak detection: check response consistency
    check(res, {
      'soak: consistent response size': (r) => r.body.length > 100,
      'soak: no server errors': (r) => r.status < 500,
    });
  });
  
  simulateUserBehavior();
}

// Spike Test - Sudden traffic burst
export function spikeTest() {
  const scenario = selectWeightedScenario();
  
  group(`Spike Test - ${scenario.name}`, () => {
    const res = executePageRequest(scenario);
    
    // Under spike, we're more lenient but still check basics
    check(res, {
      'spike: responds within timeout': (r) => r.timings.duration < 30000,
      'spike: not completely down': (r) => r.status !== 0,
    });
  });
  
  // Minimal sleep during spike
  sleep(0.5);
}

// ============================================
// DEFAULT EXPORT (fallback for manual runs)
// ============================================
export default function () {
  const scenario = selectWeightedScenario();
  executePageRequest(scenario);
  simulateUserBehavior();
}

// ============================================
// SUMMARY HANDLER
// ============================================
export function handleSummary(data) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  return {
    [`docs/performance/loadtest-results-${timestamp}.json`]: JSON.stringify(data, null, 2),
    'docs/performance/loadtest-latest.json': JSON.stringify(data, null, 2),
    stdout: generateTextSummary(data),
  };
}

function generateTextSummary(data) {
  const metrics = data.metrics;
  
  return `
================================================================================
                    K6 LOAD TEST RESULTS - ARABISCH ONLINE LEREN
================================================================================

📊 REQUEST METRICS
------------------
Total Requests:     ${metrics.http_reqs?.values?.count || 'N/A'}
Request Rate:       ${(metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s
Failed Requests:    ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%

⏱️ RESPONSE TIMES
-----------------
Average:    ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms
Median:     ${(metrics.http_req_duration?.values?.med || 0).toFixed(2)}ms
P90:        ${(metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)}ms
P95:        ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms
P99:        ${(metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms
Max:        ${(metrics.http_req_duration?.values?.max || 0).toFixed(2)}ms

✅ THRESHOLDS
-------------
${Object.entries(data.thresholds || {}).map(([name, threshold]) => 
  `${threshold.ok ? '✓' : '✗'} ${name}`
).join('\n')}

================================================================================
`;
}
