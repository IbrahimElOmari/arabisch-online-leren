import { describe, it, expect, beforeEach } from 'vitest';
import { queryCache, CacheTTL } from '@/lib/cache';

describe('Cache - Comprehensive Tests', () => {
  beforeEach(() => {
    queryCache.clear();
  });

  describe('LRU Eviction', () => {
    it('should evict oldest items when max size reached', () => {
      // Fill cache to max
      for (let i = 0; i < 100; i++) {
        queryCache.set(`key-${i}`, `value-${i}`, 60000);
      }

      const stats = queryCache.stats();
      expect(stats.size).toBe(100);

      // Add one more - should evict oldest
      queryCache.set('key-new', 'value-new', 60000);

      expect(queryCache.get('key-0')).toBeNull();
      expect(queryCache.get('key-new')).toBe('value-new');
    });
  });

  describe('Pattern Invalidation', () => {
    it('should invalidate complex patterns', () => {
      queryCache.set('user:profile:1', { id: 1 }, 60000);
      queryCache.set('user:profile:2', { id: 2 }, 60000);
      queryCache.set('user:settings:1', { theme: 'dark' }, 60000);
      queryCache.set('post:1', { title: 'Test' }, 60000);

      queryCache.invalidatePattern('^user:profile:');

      expect(queryCache.get('user:profile:1')).toBeNull();
      expect(queryCache.get('user:profile:2')).toBeNull();
      expect(queryCache.get('user:settings:1')).toBeTruthy();
      expect(queryCache.get('post:1')).toBeTruthy();
    });

    it('should handle wildcard patterns', () => {
      queryCache.set('api:users:list', [], 60000);
      queryCache.set('api:users:1', {}, 60000);
      queryCache.set('api:posts:list', [], 60000);

      queryCache.invalidatePattern('.*users.*');

      expect(queryCache.get('api:users:list')).toBeNull();
      expect(queryCache.get('api:users:1')).toBeNull();
      expect(queryCache.get('api:posts:list')).toBeTruthy();
    });
  });

  describe('TTL edge cases', () => {
    it('should handle zero TTL', () => {
      queryCache.set('key', 'value', 0);
      expect(queryCache.get('key')).toBeNull();
    });

    it('should handle negative TTL', () => {
      queryCache.set('key', 'value', -1);
      expect(queryCache.get('key')).toBeNull();
    });

    it('should handle very long TTL', () => {
      queryCache.set('key', 'value', CacheTTL.VERY_LONG);
      expect(queryCache.get('key')).toBe('value');
    });
  });

  describe('Data types', () => {
    it('should cache objects', () => {
      const obj = { id: 1, name: 'Test', nested: { value: 42 } };
      queryCache.set('obj-key', obj, 60000);
      expect(queryCache.get('obj-key')).toEqual(obj);
    });

    it('should cache arrays', () => {
      const arr = [1, 2, 3, { id: 4 }];
      queryCache.set('arr-key', arr, 60000);
      expect(queryCache.get('arr-key')).toEqual(arr);
    });

    it('should cache primitives', () => {
      queryCache.set('string', 'test', 60000);
      queryCache.set('number', 42, 60000);
      queryCache.set('boolean', true, 60000);
      queryCache.set('null', null, 60000);

      expect(queryCache.get('string')).toBe('test');
      expect(queryCache.get('number')).toBe(42);
      expect(queryCache.get('boolean')).toBe(true);
      expect(queryCache.get('null')).toBe(null);
    });
  });

  describe('Concurrent access', () => {
    it('should handle rapid sequential writes', () => {
      for (let i = 0; i < 1000; i++) {
        queryCache.set(`rapid-${i}`, `value-${i}`, 60000);
      }

      const stats = queryCache.stats();
      expect(stats.size).toBeLessThanOrEqual(100); // Should respect max size
    });

    it('should handle rapid sequential reads', () => {
      queryCache.set('test-key', 'test-value', 60000);

      for (let i = 0; i < 1000; i++) {
        const value = queryCache.get('test-key');
        expect(value).toBe('test-value');
      }
    });
  });

  describe('Memory management', () => {
    it('should report accurate cache stats', () => {
      queryCache.set('key1', 'value1', 60000);
      queryCache.set('key2', 'value2', 60000);
      queryCache.set('key3', 'value3', 60000);

      const stats = queryCache.stats();
      expect(stats.size).toBe(3);
      expect(stats.maxSize).toBe(100);
    });

    it('should clear all cache entries', () => {
      for (let i = 0; i < 50; i++) {
        queryCache.set(`key-${i}`, `value-${i}`, 60000);
      }

      queryCache.clear();

      const stats = queryCache.stats();
      expect(stats.size).toBe(0);
    });
  });
});
