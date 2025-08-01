// Client-side rate limiting utility

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
  blockedUntil?: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private storage: Map<string, RateLimitEntry> = new Map();

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private getKey(action: string, identifier?: string): string {
    return `${action}:${identifier || 'anonymous'}`;
  }

  check(action: string, config: RateLimitConfig, identifier?: string): boolean {
    const key = this.getKey(action, identifier);
    const now = Date.now();
    const entry = this.storage.get(key);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return false;
    }

    // Initialize or reset if outside window
    if (!entry || (now - entry.windowStart) > config.windowMs) {
      this.storage.set(key, {
        attempts: 1,
        windowStart: now
      });
      return true;
    }

    // Increment attempts
    entry.attempts++;

    // Check if exceeded limit
    if (entry.attempts > config.maxAttempts) {
      entry.blockedUntil = now + (config.blockDurationMs || config.windowMs);
      this.storage.set(key, entry);
      return false;
    }

    this.storage.set(key, entry);
    return true;
  }

  reset(action: string, identifier?: string): void {
    const key = this.getKey(action, identifier);
    this.storage.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (entry.blockedUntil && entry.blockedUntil < now) {
        this.storage.delete(key);
      }
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();

// Predefined configurations
export const RATE_LIMITS = {
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 }, // 5 attempts per 15 min, block 1 hour
  SIGNUP: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  PASSWORD_RESET: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  FORM_SUBMISSION: { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 attempts per minute
  API_CALL: { maxAttempts: 100, windowMs: 60 * 1000 } // 100 requests per minute
} as const;