/**
 * Spaced Repetition System (SRS) Types
 * Based on SM-2 algorithm
 */

export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewState {
  interval: number;      // Days until next review
  repetition: number;    // Number of consecutive correct reviews
  easeFactor: number;    // Difficulty multiplier (minimum 1.3)
  due: string;          // ISO timestamp when review is due
}

export interface ReviewInput {
  grade: Grade;         // Quality of recall (0-5)
  reviewedAt?: Date;    // When the review happened (defaults to now)
}

export interface ReviewResult extends ReviewState {
  nextReview: string;   // ISO timestamp of next review date
}

export interface NowProvider {
  now(): Date;          // Injectable clock for deterministic testing
}
