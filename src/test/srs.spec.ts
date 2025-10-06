import { describe, it, expect } from 'vitest';
import { initialState, review } from '../lib/srs/sm2';
import type { ReviewState } from '../lib/srs';

// Fixed clock for deterministic testing
const fixed = new Date('2025-01-01T00:00:00.000Z');
const clock = { now: () => fixed };

describe('SM-2 SRS Algorithm', () => {
  describe('initialState', () => {
    it('creates default state with correct values', () => {
      const state = initialState(fixed);
      
      expect(state.repetition).toBe(0);
      expect(state.interval).toBe(0);
      expect(state.easeFactor).toBeCloseTo(2.5);
      expect(state.due).toBe(fixed.toISOString());
    });
  });

  describe('review - correct answers (grade >= 3)', () => {
    it('schedules first review in 1 day for grade 4', () => {
      let state: ReviewState = {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        due: fixed.toISOString()
      };
      
      const result = review(state, { grade: 4 }, clock);
      
      expect(result.interval).toBe(1);
      expect(result.repetition).toBe(1);
      expect(result.easeFactor).toBeGreaterThan(2.5); // Grade 4 increases EF
    });

    it('schedules second review in 6 days for grade 5', () => {
      let state: ReviewState = {
        interval: 1,
        repetition: 1,
        easeFactor: 2.5,
        due: fixed.toISOString()
      };
      
      const result = review(state, { grade: 5 }, clock);
      
      expect(result.interval).toBe(6);
      expect(result.repetition).toBe(2);
      expect(result.easeFactor).toBeGreaterThan(2.5); // Grade 5 increases EF more
    });

    it('multiplies interval by EF for subsequent reviews', () => {
      let state: ReviewState = {
        interval: 6,
        repetition: 2,
        easeFactor: 2.5,
        due: fixed.toISOString()
      };
      
      const result = review(state, { grade: 4 }, clock);
      
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
      expect(result.repetition).toBe(3);
    });

    it('increases ease factor for perfect recall (grade 5)', () => {
      let state: ReviewState = {
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        due: fixed.toISOString()
      };
      
      const result = review(state, { grade: 5 }, clock);
      
      expect(result.easeFactor).toBeGreaterThan(2.5);
      expect(result.easeFactor).toBeCloseTo(2.6, 1);
    });

    it('decreases ease factor for hesitant recall (grade 3)', () => {
      let state: ReviewState = {
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        due: fixed.toISOString()
      };
      
      const result = review(state, { grade: 3 }, clock);
      
      expect(result.easeFactor).toBeLessThan(2.5);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3); // Min EF
    });
  });

  describe('review - incorrect answers (grade < 3)', () => {
    it('resets repetition and interval for grade 2', () => {
      let state: ReviewState = {
        interval: 15,
        repetition: 3,
        easeFactor: 2.5,
        due: fixed.toISOString()
      };
      
      const result = review(state, { grade: 2 }, clock);
      
      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(1); // Reset to 1 day
    });

    it('resets for complete failure (grade 0)', () => {
      let state: ReviewState = {
        interval: 30,
        repetition: 5,
        easeFactor: 2.8,
        due: fixed.toISOString()
      };
      
      const result = review(state, { grade: 0 }, clock);
      
      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe('ease factor boundaries', () => {
    it('never drops below minimum EF of 1.3', () => {
      let state: ReviewState = {
        interval: 1,
        repetition: 0,
        easeFactor: 1.3, // Already at minimum
        due: fixed.toISOString()
      };
      
      // Multiple low grades shouldn't drop below 1.3
      for (let i = 0; i < 5; i++) {
        state = review(state, { grade: 3 }, clock);
        expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
      }
    });

    it('can increase EF above initial 2.5', () => {
      let state: ReviewState = {
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        due: fixed.toISOString()
      };
      
      // Perfect recalls should increase EF
      state = review(state, { grade: 5 }, clock);
      state = review(state, { grade: 5 }, clock);
      state = review(state, { grade: 5 }, clock);
      
      expect(state.easeFactor).toBeGreaterThan(2.5);
    });
  });

  describe('due date calculation', () => {
    it('calculates correct next review date', () => {
      let state: ReviewState = {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        due: fixed.toISOString()
      };
      
      const result = review(state, { grade: 4 }, clock);
      
      const expectedDate = new Date(fixed.getTime() + 1 * 24 * 60 * 60 * 1000);
      expect(result.nextReview).toBe(expectedDate.toISOString());
      expect(result.due).toBe(expectedDate.toISOString());
    });

    it('uses reviewedAt parameter when provided', () => {
      const customTime = new Date('2025-01-15T12:00:00.000Z');
      let state: ReviewState = {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        due: fixed.toISOString()
      };
      
      const result = review(state, { grade: 4, reviewedAt: customTime }, clock);
      
      const expectedDate = new Date(customTime.getTime() + 1 * 24 * 60 * 60 * 1000);
      expect(result.nextReview).toBe(expectedDate.toISOString());
    });
  });
});
