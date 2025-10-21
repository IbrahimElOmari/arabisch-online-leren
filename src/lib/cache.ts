/**
 * Simple in-memory cache for Supabase queries
 * Reduces database load and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 100;

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set data in cache with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    // Implement simple LRU: remove oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

export const queryCache = new QueryCache();

/**
 * Cache helper for React Query
 * Wraps queries with cache layer before hitting database
 */
export const withCache = <T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 60000
): Promise<T> => {
  const cached = queryCache.get<T>(key);
  
  if (cached !== null) {
    return Promise.resolve(cached);
  }
  
  return queryFn().then(data => {
    queryCache.set(key, data, ttl);
    return data;
  });
};

/**
 * Common cache TTLs (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 30000,      // 30 seconds - frequently changing data
  MEDIUM: 60000,     // 1 minute - default
  LONG: 300000,      // 5 minutes - relatively static data
  VERY_LONG: 1800000 // 30 minutes - rarely changing data
} as const;
