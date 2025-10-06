/**
 * SM-2 (SuperMemo 2) Algorithm Implementation
 * 
 * The SM-2 algorithm determines optimal review intervals based on recall quality.
 * It uses three main variables:
 * - Ease Factor (EF): Difficulty multiplier (min 1.3)
 * - Interval (I): Days until next review
 * - Repetition (n): Consecutive correct reviews
 * 
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

import type { Grade, ReviewInput, ReviewResult, ReviewState, NowProvider } from './index';

const MIN_EF = 1.3;

const clampEF = (ef: number): number => Math.max(MIN_EF, ef);

/**
 * Create initial review state for a new item
 */
export function initialState(now: Date = new Date()): ReviewState {
  return {
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    due: now.toISOString()
  };
}

/**
 * Calculate next review based on grade
 * 
 * @param state - Current review state
 * @param input - Review result (grade 0-5)
 * @param clock - Time provider (for testing)
 * @returns Next review state with due date
 */
export function review(
  state: ReviewState,
  input: ReviewInput,
  clock: NowProvider = { now: () => new Date() }
): ReviewResult {
  const grade = input.grade;
  const reviewedAt = input.reviewedAt ?? clock.now();
  
  let { repetition, interval, easeFactor } = state;
  
  // Grade >= 3: Correct response
  if (grade >= 3) {
    // Calculate new interval
    if (repetition === 0) {
      interval = 1; // First correct answer: review in 1 day
    } else if (repetition === 1) {
      interval = 6; // Second correct answer: review in 6 days
    } else {
      interval = Math.round(interval * easeFactor); // Subsequent: multiply by EF
    }
    
    repetition += 1;
    
    // Update ease factor based on quality (3-5)
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = clampEF(
      easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    );
  } 
  // Grade < 3: Incorrect response - reset
  else {
    repetition = 0;
    interval = 1; // Start over with 1 day interval
  }
  
  // Calculate next review date
  const next = new Date(reviewedAt.getTime() + interval * 24 * 60 * 60 * 1000);
  const dueISO = next.toISOString();
  
  return {
    interval,
    repetition,
    easeFactor,
    due: dueISO,
    nextReview: dueISO
  };
}
