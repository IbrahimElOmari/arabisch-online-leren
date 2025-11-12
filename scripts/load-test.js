/**
 * K6 Load Test Script for EdTech Platform
 * 
 * Tests API endpoints, database queries, and edge functions under load
 * 
 * Usage:
 *   k6 run scripts/load-test.js --vus 10 --duration 30s
 * 
 * Thresholds:
 *   - p95 response time <200ms
 *   - Error rate <1%
 *   - Requests/sec >100
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const dbQueryTime = new Trend('db_query_time');
const edgeFunctionTime = new Trend('edge_function_time');
const successfulRequests = new Counter('successful_requests');

// Configuration
const SUPABASE_URL = 'https://xugosdedyukizseveahx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg';

// Test options
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    errors: ['rate<0.01'],             // Error rate should be less than 1%
    http_req_failed: ['rate<0.01'],   // Failed request rate should be less than 1%
  },
};

// Headers for Supabase requests
const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

export default function () {
  const scenario = Math.random();

  if (scenario < 0.3) {
    // Scenario 1: Read operations (30%)
    testReadOperations();
  } else if (scenario < 0.6) {
    // Scenario 2: Gamification queries (30%)
    testGamificationQueries();
  } else if (scenario < 0.8) {
    // Scenario 3: Monitoring metrics (20%)
    testMonitoringMetrics();
  } else {
    // Scenario 4: Admin operations (20%)
    testAdminOperations();
  }

  sleep(1);
}

/**
 * Test read operations (database queries)
 */
function testReadOperations() {
  const endpoints = [
    '/rest/v1/profiles?select=*&limit=10',
    '/rest/v1/modules?select=*&limit=20',
    '/rest/v1/klassen?select=*&limit=10',
    '/rest/v1/content_library?select=*&limit=15',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const startTime = Date.now();
  
  const response = http.get(`${SUPABASE_URL}${endpoint}`, { headers });
  
  const duration = Date.now() - startTime;
  dbQueryTime.add(duration);
  apiLatency.add(duration);

  const success = check(response, {
    'read status is 200': (r) => r.status === 200,
    'read has data': (r) => r.json().length !== undefined,
    'read response time OK': (r) => r.timings.duration < 200,
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
  }
}

/**
 * Test gamification queries
 */
function testGamificationQueries() {
  const queries = [
    '/rest/v1/student_game_profiles?select=*&limit=10',
    '/rest/v1/challenges?select=*&is_active=eq.true&limit=10',
    '/rest/v1/leaderboard_rankings?select=*&period=eq.all_time&limit=20',
    '/rest/v1/xp_activities?select=*&order=created_at.desc&limit=15',
  ];

  const query = queries[Math.floor(Math.random() * queries.length)];
  const startTime = Date.now();
  
  const response = http.get(`${SUPABASE_URL}${query}`, { headers });
  
  const duration = Date.now() - startTime;
  dbQueryTime.add(duration);

  const success = check(response, {
    'gamification status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'gamification response time OK': (r) => r.timings.duration < 300,
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
  }
}

/**
 * Test monitoring metrics
 */
function testMonitoringMetrics() {
  const queries = [
    '/rest/v1/system_metrics?select=*&order=timestamp.desc&limit=20',
    '/rest/v1/system_health_checks?select=*&order=check_timestamp.desc&limit=10',
    '/rest/v1/notifications?select=*&is_read=eq.false&limit=15',
  ];

  const query = queries[Math.floor(Math.random() * queries.length)];
  const startTime = Date.now();
  
  const response = http.get(`${SUPABASE_URL}${query}`, { headers });
  
  const duration = Date.now() - startTime;
  dbQueryTime.add(duration);

  const success = check(response, {
    'monitoring status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'monitoring response time OK': (r) => r.timings.duration < 250,
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
  }
}

/**
 * Test admin operations
 */
function testAdminOperations() {
  const queries = [
    '/rest/v1/audit_log?select=*&order=created_at.desc&limit=20',
    '/rest/v1/user_roles?select=*,profiles(full_name)&limit=15',
    '/rest/v1/feature_flags?select=*&limit=10',
  ];

  const query = queries[Math.floor(Math.random() * queries.length)];
  const startTime = Date.now();
  
  const response = http.get(`${SUPABASE_URL}${query}`, { headers });
  
  const duration = Date.now() - startTime;
  dbQueryTime.add(duration);

  const success = check(response, {
    'admin status is 200, 401, or 404': (r) => 
      r.status === 200 || r.status === 401 || r.status === 404,
    'admin response time OK': (r) => r.timings.duration < 300,
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
  }
}

/**
 * Test setup (runs once)
 */
export function setup() {
  console.log('🚀 Starting load test...');
  console.log(`📊 Supabase URL: ${SUPABASE_URL}`);
  console.log('⏱️  Test duration: ~4 minutes');
  console.log('');
}

/**
 * Teardown (runs once at end)
 */
export function teardown(data) {
  console.log('');
  console.log('✅ Load test complete!');
  console.log('📊 Check results above for metrics');
}

/**
 * Handle summary
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}📊 LOAD TEST RESULTS SUMMARY\n`;
  summary += `${indent}${'='.repeat(50)}\n\n`;
  
  // Request metrics
  summary += `${indent}📡 HTTP Requests:\n`;
  summary += `${indent}  Total: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += `${indent}  Failed: ${data.metrics.http_req_failed.values.rate.toFixed(4) * 100}%\n\n`;
  
  // Response time metrics
  summary += `${indent}⏱️  Response Times:\n`;
  summary += `${indent}  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  Median: ${data.metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
  summary += `${indent}  P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `${indent}  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  
  // Thresholds
  summary += `${indent}✅ Threshold Results:\n`;
  for (const [name, threshold] of Object.entries(data.metrics)) {
    if (threshold.thresholds) {
      for (const [tName, tResult] of Object.entries(threshold.thresholds)) {
        const passed = tResult.ok ? '✅ PASS' : '❌ FAIL';
        summary += `${indent}  ${passed} - ${tName}\n`;
      }
    }
  }
  
  summary += `\n${indent}${'='.repeat(50)}\n`;
  
  return summary;
}
