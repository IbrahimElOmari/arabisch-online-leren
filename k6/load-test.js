/**
 * K6 Load Testing Script
 * 
 * Dit script simuleert realistisch gebruikersgedrag op het platform.
 * 
 * Installatie:
 * brew install k6  (macOS)
 * of download van https://k6.io/
 * 
 * Gebruik:
 * k6 run k6/load-test.js
 * 
 * Met opties:
 * k6 run --vus 100 --duration 5m k6/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const dashboardDuration = new Trend('dashboard_duration');
const forumDuration = new Trend('forum_duration');
const apiCalls = new Counter('api_calls');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';

// Load test stages
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50 users
    { duration: '5m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 200 },   // Ramp up to 200 users
    { duration: '10m', target: 200 },  // Stay at 200 users
    { duration: '5m', target: 500 },   // Spike to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '5m', target: 100 },   // Ramp down to 100
    { duration: '2m', target: 0 },     // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% onder 500ms, 99% onder 1s
    'http_req_failed': ['rate<0.01'],                  // Error rate < 1%
    'errors': ['rate<0.05'],                           // Custom error rate < 5%
    'login_duration': ['p(95)<1000'],                  // Login < 1s (95th percentile)
    'dashboard_duration': ['p(95)<2000'],              // Dashboard < 2s
    'forum_duration': ['p(95)<1500'],                  // Forum < 1.5s
  },
};

// User scenarios with realistic weights
export default function () {
  const scenario = Math.random();

  if (scenario < 0.3) {
    // 30% - Browse public content
    browsePublicContent();
  } else if (scenario < 0.6) {
    // 30% - Student workflow
    studentWorkflow();
  } else if (scenario < 0.85) {
    // 25% - Forum interaction
    forumInteraction();
  } else {
    // 15% - Teacher workflow
    teacherWorkflow();
  }

  sleep(Math.random() * 5 + 2); // Random sleep 2-7 seconds
}

/**
 * Browse public content (unauthenticated)
 */
function browsePublicContent() {
  group('Public Browse', () => {
    // Homepage
    let res = http.get(`${BASE_URL}/`);
    check(res, {
      'homepage loaded': (r) => r.status === 200,
      'homepage load time OK': (r) => r.timings.duration < 1000,
    });
    errorRate.add(res.status !== 200);
    apiCalls.add(1);

    sleep(1);

    // Browse modules
    res = http.get(`${BASE_URL}/modules`);
    check(res, {
      'modules page loaded': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    apiCalls.add(1);

    sleep(2);

    // View module detail
    res = http.get(`${BASE_URL}/modules/module-123`);
    check(res, {
      'module detail loaded': (r) => r.status === 200,
    });
    apiCalls.add(1);
  });
}

/**
 * Student workflow (authenticated)
 */
function studentWorkflow() {
  group('Student Workflow', () => {
    // Login
    const loginStart = Date.now();
    const authRes = http.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({
        email: `student${Math.floor(Math.random() * 1000)}@test.com`,
        password: 'testpassword123',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    const loginTime = Date.now() - loginStart;
    loginDuration.add(loginTime);
    apiCalls.add(1);

    if (authRes.status !== 200) {
      errorRate.add(1);
      return; // Skip rest if login fails
    }

    const authData = JSON.parse(authRes.body);
    const accessToken = authData.access_token;

    sleep(1);

    // Load dashboard
    const dashStart = Date.now();
    const dashRes = http.get(`${BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const dashTime = Date.now() - dashStart;
    dashboardDuration.add(dashTime);
    apiCalls.add(1);

    check(dashRes, {
      'dashboard loaded': (r) => r.status === 200,
      'dashboard fast': (r) => r.timings.duration < 2000,
    });
    errorRate.add(dashRes.status !== 200);

    sleep(2);

    // Fetch enrollments
    const enrollRes = http.get(
      `${SUPABASE_URL}/rest/v1/enrollments?select=*,module:modules(*),class:module_classes(*)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    check(enrollRes, {
      'enrollments fetched': (r) => r.status === 200,
    });
    apiCalls.add(1);

    sleep(1);

    // Fetch progress
    const progressRes = http.get(
      `${SUPABASE_URL}/rest/v1/student_niveau_progress?select=*,niveau:niveaus(*)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    check(progressRes, {
      'progress fetched': (r) => r.status === 200,
    });
    apiCalls.add(1);

    sleep(2);

    // Submit task
    const taskSubmitRes = http.post(
      `${SUPABASE_URL}/rest/v1/task_submissions`,
      JSON.stringify({
        task_id: 'task-123',
        student_id: authData.user.id,
        submission_text: 'My answer to the task',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
      }
    );
    check(taskSubmitRes, {
      'task submitted': (r) => r.status === 201,
    });
    apiCalls.add(1);
  });
}

/**
 * Forum interaction
 */
function forumInteraction() {
  group('Forum Interaction', () => {
    // Login (simplified)
    const authRes = http.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({
        email: `user${Math.floor(Math.random() * 1000)}@test.com`,
        password: 'testpassword123',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );
    apiCalls.add(1);

    if (authRes.status !== 200) {
      errorRate.add(1);
      return;
    }

    const authData = JSON.parse(authRes.body);
    const accessToken = authData.access_token;

    sleep(1);

    // Browse forum
    const forumStart = Date.now();
    const forumRes = http.get(
      `${SUPABASE_URL}/rest/v1/forum_posts?select=*,author:profiles!author_id(*)&limit=20&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    const forumTime = Date.now() - forumStart;
    forumDuration.add(forumTime);
    apiCalls.add(1);

    check(forumRes, {
      'forum posts loaded': (r) => r.status === 200,
      'forum fast': (r) => r.timings.duration < 1500,
    });
    errorRate.add(forumRes.status !== 200);

    sleep(2);

    // View post detail
    const postRes = http.get(
      `${SUPABASE_URL}/rest/v1/forum_posts?select=*,author:profiles!author_id(*),replies:forum_reacties(*)&id=eq.post-123`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    check(postRes, {
      'post detail loaded': (r) => r.status === 200,
    });
    apiCalls.add(1);

    sleep(1);

    // Create reply
    const replyRes = http.post(
      `${SUPABASE_URL}/rest/v1/forum_reacties`,
      JSON.stringify({
        post_id: 'post-123',
        author_id: authData.user.id,
        inhoud: 'Great post! Thanks for sharing.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
      }
    );
    check(replyRes, {
      'reply created': (r) => r.status === 201,
    });
    apiCalls.add(1);

    sleep(1);

    // Like post
    const likeRes = http.post(
      `${SUPABASE_URL}/rest/v1/forum_likes`,
      JSON.stringify({
        post_id: 'post-123',
        user_id: authData.user.id,
        is_like: true,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
      }
    );
    apiCalls.add(1);
  });
}

/**
 * Teacher workflow
 */
function teacherWorkflow() {
  group('Teacher Workflow', () => {
    // Login as teacher
    const authRes = http.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({
        email: `teacher${Math.floor(Math.random() * 100)}@test.com`,
        password: 'testpassword123',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );
    apiCalls.add(1);

    if (authRes.status !== 200) {
      errorRate.add(1);
      return;
    }

    const authData = JSON.parse(authRes.body);
    const accessToken = authData.access_token;

    sleep(1);

    // View classes
    const classRes = http.get(
      `${SUPABASE_URL}/rest/v1/klassen?select=*&teacher_id=eq.${authData.user.id}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    check(classRes, {
      'classes loaded': (r) => r.status === 200,
    });
    apiCalls.add(1);

    sleep(2);

    // View student submissions
    const submissionsRes = http.get(
      `${SUPABASE_URL}/rest/v1/task_submissions?select=*,student:profiles!student_id(*),task:tasks(*)&limit=50`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    check(submissionsRes, {
      'submissions loaded': (r) => r.status === 200,
    });
    apiCalls.add(1);

    sleep(3);

    // Grade submission
    const gradeRes = http.patch(
      `${SUPABASE_URL}/rest/v1/task_submissions?id=eq.submission-123`,
      JSON.stringify({
        grade: 85,
        feedback: 'Good work! Keep it up.',
        beoordeeld_door: authData.user.id,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
      }
    );
    check(gradeRes, {
      'submission graded': (r) => r.status === 200,
    });
    apiCalls.add(1);

    sleep(1);

    // Create announcement
    const announcementRes = http.post(
      `${SUPABASE_URL}/rest/v1/bulk_messages`,
      JSON.stringify({
        sender_id: authData.user.id,
        subject: 'Class Announcement',
        message: 'Remember: exam next week!',
        target_audience: { role: 'leerling', class_id: 'class-123' },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
      }
    );
    apiCalls.add(1);
  });
}

/**
 * Teardown function
 */
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Helper function for text summary
function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n' + indent + '=== Load Test Summary ===\n\n';

  summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  summary += indent + `Failed Requests: ${data.metrics.http_req_failed.values.rate.toFixed(2)}%\n\n`;

  summary += indent + 'Response Times:\n';
  summary += indent + `  p50: ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += indent + `  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;

  if (data.metrics.login_duration) {
    summary += indent + `Login Duration (p95): ${data.metrics.login_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.dashboard_duration) {
    summary += indent + `Dashboard Duration (p95): ${data.metrics.dashboard_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.forum_duration) {
    summary += indent + `Forum Duration (p95): ${data.metrics.forum_duration.values['p(95)'].toFixed(2)}ms\n`;
  }

  summary += '\n' + indent + '=== End Summary ===\n';

  return summary;
}
