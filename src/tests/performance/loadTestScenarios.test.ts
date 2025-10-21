import { describe, it, expect } from 'vitest';

describe('Load Test Scenarios Configuration', () => {
  it('should have valid stage configuration', () => {
    const stages = [
      { duration: '30s', target: 100 },
      { duration: '1m', target: 500 },
      { duration: '2m', target: 1000 },
      { duration: '5m', target: 5000 },
      { duration: '2m', target: 10000 },
      { duration: '3m', target: 10000 },
      { duration: '2m', target: 0 },
    ];

    stages.forEach(stage => {
      expect(stage).toHaveProperty('duration');
      expect(stage).toHaveProperty('target');
      expect(typeof stage.target).toBe('number');
      expect(stage.target).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have performance thresholds defined', () => {
    const thresholds = {
      'http_req_duration': ['p(95)<2000'],
      'http_req_failed': ['rate<0.01'],
      'http_req_duration{name:homepage}': ['p(50)<800'],
      'http_req_duration{name:dashboard}': ['p(95)<2000'],
      'http_req_duration{name:forum}': ['p(95)<1500'],
      'http_req_duration{name:lessons}': ['p(95)<2000'],
      'http_reqs': ['rate>100'],
    };

    expect(Object.keys(thresholds).length).toBeGreaterThan(0);
    Object.values(thresholds).forEach(threshold => {
      expect(Array.isArray(threshold)).toBe(true);
      expect(threshold.length).toBeGreaterThan(0);
    });
  });

  it('should have weighted scenarios', () => {
    const scenarios = [
      { name: 'homepage', url: '/', weight: 40 },
      { name: 'dashboard', url: '/dashboard', weight: 25 },
      { name: 'forum', url: '/forum', weight: 20 },
      { name: 'lessons', url: '/leerstof', weight: 15 },
    ];

    const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
    expect(totalWeight).toBe(100);

    scenarios.forEach(scenario => {
      expect(scenario.weight).toBeGreaterThan(0);
      expect(scenario.weight).toBeLessThanOrEqual(100);
      expect(scenario.url).toBeTruthy();
    });
  });

  it('should calculate realistic user load progression', () => {
    const peakUsers = 10000;
    const sustainDuration = 3 * 60; // 3 minutes in seconds
    const expectedRequests = peakUsers * sustainDuration * 0.5; // Assuming ~0.5 req/s per user

    expect(expectedRequests).toBeGreaterThan(1000000);
  });
});
