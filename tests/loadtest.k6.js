import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 1000 },   // Ramp up to 1,000 users
    { duration: '5m', target: 10000 },  // Stay at 10,000 users
    { duration: '2m', target: 0 },      // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests < 2s
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
    http_req_duration: ['p(50)<800'],   // 50% of requests < 800ms (TTFB)
  },
};

const BASE_URL = __ENV.APP_URL || 'https://arabisch-online-leren.vercel.app';

export default function () {
  // Test scenario 1: Homepage
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage status 200': (r) => r.status === 200,
    'homepage TTFB < 800ms': (r) => r.timings.waiting < 800,
  });
  sleep(1);

  // Test scenario 2: Dashboard (if authenticated)
  res = http.get(`${BASE_URL}/dashboard`);
  check(res, {
    'dashboard accessible': (r) => r.status === 200 || r.status === 401,
  });
  sleep(1);

  // Test scenario 3: Forum
  res = http.get(`${BASE_URL}/forum`);
  check(res, {
    'forum status ok': (r) => r.status === 200 || r.status === 401,
  });
  sleep(1);

  // Test scenario 4: Lessons
  res = http.get(`${BASE_URL}/leerstof`);
  check(res, {
    'lessons status ok': (r) => r.status === 200 || r.status === 401,
  });
  sleep(2);
}

export function handleSummary(data) {
  return {
    'docs/loadtest-results.json': JSON.stringify(data, null, 2),
    stdout: '\n' + JSON.stringify(data, null, 2) + '\n',
  };
}
