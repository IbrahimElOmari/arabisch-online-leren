/**
 * K6 Load Testing Script with Smoke, Load, and Stress Scenarios
 * 
 * Dit script simuleert realistisch gebruikersgedrag op het platform
 * met drie scenario's: smoke test, load test, en stress test.
 * 
 * Installatie:
 * brew install k6  (macOS)
 * of download van https://k6.io/
 * 
 * Gebruik:
 * k6 run k6/load-test.js                           # Default load test
 * k6 run --env SCENARIO=smoke k6/load-test.js      # Smoke test
 * k6 run --env SCENARIO=load k6/load-test.js       # Load test
 * k6 run --env SCENARIO=stress k6/load-test.js     # Stress test
 * k6 run --env SCENARIO=spike k6/load-test.js      # Spike test
 * k6 run --env SCENARIO=soak k6/load-test.js       # Soak test
 */

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ==================== Custom Metrics ====================
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const dashboardDuration = new Trend('dashboard_duration');
const forumDuration = new Trend('forum_duration');
const apiLatency = new Trend('api_latency');
const dbQueryTime = new Trend('db_query_time');
const apiCalls = new Counter('api_calls');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');
const activeUsers = new Gauge('active_users');

// ==================== Configuration ====================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';
const SCENARIO = __ENV.SCENARIO || 'load';

// ==================== Scenario Definitions ====================
const scenarios = {
  // Smoke Test: Quick sanity check with minimal load
  smoke: {
    stages: [
      { duration: '1m', target: 5 },    // Ramp up to 5 users
      { duration: '2m', target: 5 },    // Stay at 5 users
      { duration: '30s', target: 0 },   // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<1500'],  // Relaxed for smoke
      http_req_failed: ['rate<0.05'],     // Allow 5% errors
      errors: ['rate<0.1'],
    },
  },
  
  // Load Test: Normal expected load
  load: {
    stages: [
      { duration: '2m', target: 50 },    // Ramp up to 50 users
      { duration: '5m', target: 100 },   // Ramp up to 100 users
      { duration: '5m', target: 200 },   // Ramp up to 200 users
      { duration: '10m', target: 200 },  // Stay at 200 users
      { duration: '5m', target: 100 },   // Ramp down to 100
      { duration: '2m', target: 0 },     // Ramp down to 0
    ],
    thresholds: {
      http_req_duration: ['p(95)<500', 'p(99)<1000'],
      http_req_failed: ['rate<0.01'],
      errors: ['rate<0.05'],
      login_duration: ['p(95)<1000'],
      dashboard_duration: ['p(95)<2000'],
      forum_duration: ['p(95)<1500'],
    },
  },
  
  // Stress Test: Push beyond normal load to find limits
  stress: {
    stages: [
      { duration: '2m', target: 100 },   // Ramp up
      { duration: '5m', target: 200 },   // Normal load
      { duration: '5m', target: 400 },   // High load
      { duration: '5m', target: 600 },   // Very high load
      { duration: '5m', target: 800 },   // Extreme load
      { duration: '5m', target: 1000 },  // Breaking point
      { duration: '5m', target: 1000 },  // Sustain breaking point
      { duration: '5m', target: 0 },     // Recovery
    ],
    thresholds: {
      http_req_duration: ['p(95)<3000'],  // More relaxed for stress
      http_req_failed: ['rate<0.1'],       // Allow 10% errors at stress
      errors: ['rate<0.15'],
    },
  },
  
  // Spike Test: Sudden traffic spike
  spike: {
    stages: [
      { duration: '1m', target: 50 },    // Normal load
      { duration: '30s', target: 500 },  // Spike!
      { duration: '2m', target: 500 },   // Stay at spike
      { duration: '30s', target: 50 },   // Back to normal
      { duration: '2m', target: 50 },    // Stay at normal
      { duration: '1m', target: 0 },     // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000'],
      http_req_failed: ['rate<0.05'],
    },
  },
  
  // Soak Test: Extended duration for memory leaks
  soak: {
    stages: [
      { duration: '5m', target: 100 },   // Ramp up
      { duration: '1h', target: 100 },   // Stay at 100 for 1 hour
      { duration: '5m', target: 0 },     // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<500'],
      http_req_failed: ['rate<0.01'],
      errors: ['rate<0.02'],
    },
  },
};

// Select active scenario
const activeScenario = scenarios[SCENARIO] || scenarios.load;

export const options = {
  stages: activeScenario.stages,
  thresholds: {
    ...activeScenario.thresholds,
    // Global thresholds
    'http_req_duration{type:api}': ['p(95)<1000'],
    'http_req_duration{type:page}': ['p(95)<2000'],
    'http_req_duration{type:auth}': ['p(95)<1500'],
  },
  // Tags for better organization
  tags: {
    scenario: SCENARIO,
    environment: __ENV.ENVIRONMENT || 'staging',
  },
};

// ==================== Test Data ====================
const testUsers = [
  { email: 'student1@test.com', password: 'testpass123', role: 'student' },
  { email: 'student2@test.com', password: 'testpass123', role: 'student' },
  { email: 'teacher1@test.com', password: 'testpass123', role: 'teacher' },
  { email: 'admin@test.com', password: 'testpass123', role: 'admin' },
];

const endpoints = {
  pages: ['/', '/modules', '/dashboard', '/forum', '/leerstof'],
  api: {
    enrollments: '/rest/v1/enrollments?select=*',
    progress: '/rest/v1/student_niveau_progress?select=*',
    forumPosts: '/rest/v1/forum_posts?select=*&limit=20&order=created_at.desc',
    classes: '/rest/v1/klassen?select=*',
    notifications: '/rest/v1/notifications?select=*&limit=10',
  },
};

// ==================== Main Test Function ====================
export default function () {
  const scenario = Math.random();
  
  activeUsers.add(1);

  try {
    if (scenario < 0.25) {
      browsePublicContent();
    } else if (scenario < 0.50) {
      studentWorkflow();
    } else if (scenario < 0.75) {
      forumInteraction();
    } else if (scenario < 0.90) {
      teacherWorkflow();
    } else {
      apiHealthCheck();
    }
  } finally {
    activeUsers.add(-1);
  }

  // Realistic think time
  sleep(randomIntBetween(2, 7));
}

// ==================== Setup & Teardown ====================
export function setup() {
  console.log(`\n🚀 Starting ${SCENARIO.toUpperCase()} test`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Stages: ${JSON.stringify(activeScenario.stages)}\n`);
  
  // Verify endpoints are accessible
  const healthCheck = http.get(`${BASE_URL}/`);
  if (healthCheck.status !== 200) {
    console.warn('⚠️ Base URL not responding correctly');
  }
  
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n✅ ${SCENARIO.toUpperCase()} test completed in ${duration.toFixed(2)}s\n`);
}

// ==================== Scenario Functions ====================

/**
 * Browse public content (unauthenticated)
 */
function browsePublicContent() {
  group('Public Browse', () => {
    // Homepage
    const homeRes = http.get(`${BASE_URL}/`, {
      tags: { type: 'page', name: 'homepage' },
    });
    
    const homeCheck = check(homeRes, {
      'homepage loaded': (r) => r.status === 200,
      'homepage fast': (r) => r.timings.duration < 1500,
      'homepage has content': (r) => r.body && r.body.length > 100,
    });
    
    errorRate.add(!homeCheck);
    apiCalls.add(1);
    
    sleep(randomIntBetween(1, 3));

    // Browse modules
    const modulesRes = http.get(`${BASE_URL}/modules`, {
      tags: { type: 'page', name: 'modules' },
    });
    
    check(modulesRes, {
      'modules page loaded': (r) => r.status === 200 || r.status === 302,
    });
    apiCalls.add(1);
    
    sleep(randomIntBetween(2, 4));

    // View landing/pricing
    const pricingRes = http.get(`${BASE_URL}/pricing`, {
      tags: { type: 'page', name: 'pricing' },
    });
    apiCalls.add(1);
  });
}

/**
 * Student workflow (authenticated)
 */
function studentWorkflow() {
  group('Student Workflow', () => {
    const user = testUsers.filter(u => u.role === 'student')[randomIntBetween(0, 1)];
    
    // Login
    const { token, userId } = authenticateUser(user.email, user.password);
    if (!token) {
      failedLogins.add(1);
      return;
    }
    successfulLogins.add(1);
    
    const authHeaders = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    };

    sleep(1);

    // Load dashboard
    const dashStart = Date.now();
    const dashRes = http.get(`${BASE_URL}/dashboard`, {
      tags: { type: 'page', name: 'dashboard' },
    });
    dashboardDuration.add(Date.now() - dashStart);
    
    check(dashRes, {
      'dashboard accessible': (r) => r.status === 200 || r.status === 302,
    });
    apiCalls.add(1);

    sleep(2);

    // Fetch enrollments
    const enrollStart = Date.now();
    const enrollRes = http.get(
      `${SUPABASE_URL}${endpoints.api.enrollments}`,
      { headers: authHeaders, tags: { type: 'api', name: 'enrollments' } }
    );
    dbQueryTime.add(Date.now() - enrollStart);
    
    check(enrollRes, {
      'enrollments fetched': (r) => r.status === 200,
      'enrollments fast': (r) => r.timings.duration < 500,
    });
    apiCalls.add(1);

    sleep(1);

    // Fetch progress
    const progressRes = http.get(
      `${SUPABASE_URL}${endpoints.api.progress}`,
      { headers: authHeaders, tags: { type: 'api', name: 'progress' } }
    );
    
    check(progressRes, {
      'progress fetched': (r) => r.status === 200,
    });
    apiCalls.add(1);

    sleep(2);

    // Fetch notifications
    const notifRes = http.get(
      `${SUPABASE_URL}${endpoints.api.notifications}`,
      { headers: authHeaders, tags: { type: 'api', name: 'notifications' } }
    );
    apiCalls.add(1);
  });
}

/**
 * Forum interaction
 */
function forumInteraction() {
  group('Forum Interaction', () => {
    const user = randomItem(testUsers);
    
    const { token, userId } = authenticateUser(user.email, user.password);
    if (!token) {
      failedLogins.add(1);
      return;
    }
    successfulLogins.add(1);
    
    const authHeaders = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    };

    sleep(1);

    // Browse forum posts
    const forumStart = Date.now();
    const forumRes = http.get(
      `${SUPABASE_URL}${endpoints.api.forumPosts}`,
      { headers: authHeaders, tags: { type: 'api', name: 'forum_list' } }
    );
    forumDuration.add(Date.now() - forumStart);
    
    const forumCheck = check(forumRes, {
      'forum posts loaded': (r) => r.status === 200,
      'forum fast': (r) => r.timings.duration < 1500,
    });
    
    errorRate.add(!forumCheck);
    apiCalls.add(1);

    sleep(randomIntBetween(2, 4));

    // Simulate reading posts
    sleep(randomIntBetween(3, 8));
  });
}

/**
 * Teacher workflow
 */
function teacherWorkflow() {
  group('Teacher Workflow', () => {
    const teacher = testUsers.find(u => u.role === 'teacher');
    
    const { token, userId } = authenticateUser(teacher.email, teacher.password);
    if (!token) {
      failedLogins.add(1);
      return;
    }
    successfulLogins.add(1);
    
    const authHeaders = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    };

    sleep(1);

    // View classes
    const classRes = http.get(
      `${SUPABASE_URL}${endpoints.api.classes}&teacher_id=eq.${userId}`,
      { headers: authHeaders, tags: { type: 'api', name: 'classes' } }
    );
    
    check(classRes, {
      'classes loaded': (r) => r.status === 200,
    });
    apiCalls.add(1);

    sleep(2);

    // View submissions
    const submissionsRes = http.get(
      `${SUPABASE_URL}/rest/v1/task_submissions?select=*&limit=50`,
      { headers: authHeaders, tags: { type: 'api', name: 'submissions' } }
    );
    
    check(submissionsRes, {
      'submissions loaded': (r) => r.status === 200,
    });
    apiCalls.add(1);

    sleep(3);
  });
}

/**
 * API Health Check
 */
function apiHealthCheck() {
  group('API Health Check', () => {
    const endpoints_to_check = [
      { url: `${BASE_URL}/`, name: 'homepage' },
      { url: `${SUPABASE_URL}/rest/v1/`, name: 'supabase_rest' },
    ];

    endpoints_to_check.forEach(endpoint => {
      const start = Date.now();
      const res = http.get(endpoint.url, {
        headers: { 'apikey': SUPABASE_ANON_KEY },
        tags: { type: 'health', name: endpoint.name },
      });
      
      apiLatency.add(Date.now() - start);
      
      check(res, {
        [`${endpoint.name} healthy`]: (r) => r.status < 500,
      });
      apiCalls.add(1);
    });
  });
}

// ==================== Helper Functions ====================

/**
 * Authenticate user and return token
 */
function authenticateUser(email, password) {
  const loginStart = Date.now();
  
  const authRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email, password }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      tags: { type: 'auth', name: 'login' },
    }
  );

  loginDuration.add(Date.now() - loginStart);
  apiCalls.add(1);

  if (authRes.status !== 200) {
    errorRate.add(1);
    return { token: null, userId: null };
  }

  try {
    const authData = JSON.parse(authRes.body);
    return { 
      token: authData.access_token, 
      userId: authData.user?.id 
    };
  } catch (e) {
    errorRate.add(1);
    return { token: null, userId: null };
  }
}

// ==================== Summary Handler ====================
export function handleSummary(data) {
  const summary = generateTextSummary(data);
  
  return {
    'stdout': summary,
    [`k6-results-${SCENARIO}-${Date.now()}.json`]: JSON.stringify(data, null, 2),
    'k6-latest-summary.json': JSON.stringify({
      scenario: SCENARIO,
      timestamp: new Date().toISOString(),
      metrics: {
        requests: data.metrics.http_reqs?.values,
        duration: data.metrics.http_req_duration?.values,
        errors: data.metrics.http_req_failed?.values,
        custom: {
          loginDuration: data.metrics.login_duration?.values,
          dashboardDuration: data.metrics.dashboard_duration?.values,
          forumDuration: data.metrics.forum_duration?.values,
        },
      },
      thresholds: Object.entries(data.metrics)
        .filter(([_, m]) => m.thresholds)
        .reduce((acc, [name, m]) => {
          acc[name] = m.thresholds;
          return acc;
        }, {}),
    }, null, 2),
  };
}

function generateTextSummary(data) {
  const metrics = data.metrics;
  
  let summary = `
╔══════════════════════════════════════════════════════════════════╗
║              K6 LOAD TEST RESULTS - ${SCENARIO.toUpperCase().padEnd(15)}               ║
╠══════════════════════════════════════════════════════════════════╣

📊 REQUEST METRICS
   Total Requests:     ${formatNumber(metrics.http_reqs?.values?.count || 0)}
   Request Rate:       ${(metrics.http_reqs?.values?.rate || 0).toFixed(2)}/s
   Failed Requests:    ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%

⏱️  RESPONSE TIMES
   Average:            ${formatMs(metrics.http_req_duration?.values?.avg)}
   Median (p50):       ${formatMs(metrics.http_req_duration?.values?.['p(50)'])}
   p95:                ${formatMs(metrics.http_req_duration?.values?.['p(95)'])}
   p99:                ${formatMs(metrics.http_req_duration?.values?.['p(99)'])}
   Max:                ${formatMs(metrics.http_req_duration?.values?.max)}

🔐 AUTHENTICATION
   Login Duration p95: ${formatMs(metrics.login_duration?.values?.['p(95)'])}
   Successful Logins:  ${formatNumber(metrics.successful_logins?.values?.count || 0)}
   Failed Logins:      ${formatNumber(metrics.failed_logins?.values?.count || 0)}

📱 PAGE PERFORMANCE
   Dashboard p95:      ${formatMs(metrics.dashboard_duration?.values?.['p(95)'])}
   Forum p95:          ${formatMs(metrics.forum_duration?.values?.['p(95)'])}

🗄️  DATABASE
   API Latency p95:    ${formatMs(metrics.api_latency?.values?.['p(95)'])}
   DB Query Time p95:  ${formatMs(metrics.db_query_time?.values?.['p(95)'])}

📈 COUNTERS
   Total API Calls:    ${formatNumber(metrics.api_calls?.values?.count || 0)}
   Error Rate:         ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%

✅ THRESHOLDS
${formatThresholds(data)}
╚══════════════════════════════════════════════════════════════════╝
`;

  return summary;
}

function formatNumber(num) {
  return num.toLocaleString();
}

function formatMs(value) {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(2)}ms`;
}

function formatThresholds(data) {
  let result = '';
  for (const [name, metric] of Object.entries(data.metrics)) {
    if (metric.thresholds) {
      for (const [threshold, passed] of Object.entries(metric.thresholds)) {
        const icon = passed ? '✓' : '✗';
        result += `   ${icon} ${name}: ${threshold}\n`;
      }
    }
  }
  return result || '   No thresholds defined\n';
}
