import { describe, it, expect, beforeEach } from 'vitest';
import { queryCache, withCache, CacheTTL } from '@/lib/cache';

describe('Query Cache', () => {
  beforeEach(() => {
    queryCache.clear();
  });

  describe('Basic caching', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'Test' };
      queryCache.set('test-key', testData, 60000);

      const retrieved = queryCache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = queryCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should expire data after TTL', async () => {
      const testData = { id: 1, name: 'Test' };
      queryCache.set('expire-test', testData, 50); // 50ms TTL

      // Should exist immediately
      expect(queryCache.get('expire-test')).toEqual(testData);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be expired
      expect(queryCache.get('expire-test')).toBeNull();
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate specific key', () => {
      queryCache.set('key1', { data: '1' }, 60000);
      queryCache.set('key2', { data: '2' }, 60000);

      queryCache.invalidate('key1');

      expect(queryCache.get('key1')).toBeNull();
      expect(queryCache.get('key2')).not.toBeNull();
    });

    it('should invalidate by pattern', () => {
      queryCache.set('user:1', { id: 1 }, 60000);
      queryCache.set('user:2', { id: 2 }, 60000);
      queryCache.set('post:1', { id: 1 }, 60000);

      queryCache.invalidatePattern('^user:');

      expect(queryCache.get('user:1')).toBeNull();
      expect(queryCache.get('user:2')).toBeNull();
      expect(queryCache.get('post:1')).not.toBeNull();
    });

    it('should clear all cache', () => {
      queryCache.set('key1', { data: '1' }, 60000);
      queryCache.set('key2', { data: '2' }, 60000);

      queryCache.clear();

      expect(queryCache.get('key1')).toBeNull();
      expect(queryCache.get('key2')).toBeNull();
    });
  });

  describe('withCache wrapper', () => {
    it('should cache query results', async () => {
      let callCount = 0;
      const queryFn = async () => {
        callCount++;
        return { id: 1, data: 'test' };
      };

      // First call
      const result1 = await withCache('test-query', queryFn, 60000);
      expect(result1).toEqual({ id: 1, data: 'test' });
      expect(callCount).toBe(1);

      // Second call should use cache
      const result2 = await withCache('test-query', queryFn, 60000);
      expect(result2).toEqual({ id: 1, data: 'test' });
      expect(callCount).toBe(1); // Not incremented
    });

    it('should call queryFn again after cache expiration', async () => {
      let callCount = 0;
      const queryFn = async () => {
        callCount++;
        return { count: callCount };
      };

      // First call
      await withCache('expire-query', queryFn, 50);
      expect(callCount).toBe(1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second call after expiration
      await withCache('expire-query', queryFn, 50);
      expect(callCount).toBe(2);
    });
  });

  describe('Cache TTL constants', () => {
    it('should have defined TTL values', () => {
      expect(CacheTTL.SHORT).toBe(30000);
      expect(CacheTTL.MEDIUM).toBe(60000);
      expect(CacheTTL.LONG).toBe(300000);
      expect(CacheTTL.VERY_LONG).toBe(1800000);
    });

    it('should have increasing TTL values', () => {
      expect(CacheTTL.SHORT).toBeLessThan(CacheTTL.MEDIUM);
      expect(CacheTTL.MEDIUM).toBeLessThan(CacheTTL.LONG);
      expect(CacheTTL.LONG).toBeLessThan(CacheTTL.VERY_LONG);
    });
  });

  describe('Cache statistics', () => {
    it('should report correct cache size', () => {
      queryCache.set('key1', { data: '1' }, 60000);
      queryCache.set('key2', { data: '2' }, 60000);

      const stats = queryCache.stats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(100);
    });
  });
});
