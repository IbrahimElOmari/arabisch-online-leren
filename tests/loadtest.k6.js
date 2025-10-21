import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Warm up to 100 users
    { duration: '1m', target: 500 },    // Ramp to 500 users
    { duration: '2m', target: 1000 },   // Ramp up to 1,000 users
    { duration: '5m', target: 5000 },   // Stay at 5,000 users (realistic target)
    { duration: '2m', target: 10000 },  // Peak load at 10,000 users
    { duration: '3m', target: 10000 },  // Sustain peak
    { duration: '2m', target: 0 },      // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],       // 95% of requests < 2s
    http_req_failed: ['rate<0.01'],          // Error rate < 1%
    'http_req_duration{name:homepage}': ['p(50)<800'],  // Homepage TTFB < 800ms
    'http_req_duration{name:dashboard}': ['p(95)<2000'], // Dashboard < 2s
    'http_req_duration{name:forum}': ['p(95)<1500'],     // Forum < 1.5s
    'http_req_duration{name:lessons}': ['p(95)<2000'],   // Lessons < 2s
    http_reqs: ['rate>100'],                 // Throughput > 100 req/s
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

const BASE_URL = __ENV.APP_URL || 'https://arabisch-online-leren.vercel.app';

export default function () {
  const scenarios = [
    { name: 'homepage', url: '/', weight: 40 },
    { name: 'dashboard', url: '/dashboard', weight: 25 },
    { name: 'forum', url: '/forum', weight: 20 },
    { name: 'lessons', url: '/leerstof', weight: 15 },
  ];

  // Weighted random scenario selection
  const random = Math.random() * 100;
  let cumulative = 0;
  let selectedScenario = scenarios[0];

  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      selectedScenario = scenario;
      break;
    }
  }

  // Execute request with proper tagging
  const res = http.get(`${BASE_URL}${selectedScenario.url}`, {
    tags: { name: selectedScenario.name },
  });

  // Comprehensive checks
  check(res, {
    [`${selectedScenario.name}: status OK`]: (r) => r.status === 200 || r.status === 401 || r.status === 302,
    [`${selectedScenario.name}: response time OK`]: (r) => r.timings.duration < 5000,
    [`${selectedScenario.name}: has content`]: (r) => r.body.length > 0,
    [`${selectedScenario.name}: TTFB OK`]: (r) => r.timings.waiting < 2000,
  });

  // Variable sleep to simulate realistic user behavior
  const thinkTime = Math.random() * 3 + 1; // 1-4 seconds
  sleep(thinkTime);
}

export function handleSummary(data) {
  return {
    'docs/loadtest-results.json': JSON.stringify(data, null, 2),
    stdout: '\n' + JSON.stringify(data, null, 2) + '\n',
  };
}
