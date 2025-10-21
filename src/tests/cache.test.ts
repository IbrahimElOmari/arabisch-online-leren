import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queryCache, withCache, CacheTTL } from '@/lib/cache';

describe('QueryCache', () => {
  beforeEach(() => {
    queryCache.clear();
  });

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
    queryCache.set('test-key', testData, 100); // 100ms TTL
    
    // Should exist immediately
    expect(queryCache.get('test-key')).toEqual(testData);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should be null after expiration
    expect(queryCache.get('test-key')).toBeNull();
  });

  it('should invalidate specific keys', () => {
    queryCache.set('key1', 'value1', 60000);
    queryCache.set('key2', 'value2', 60000);
    
    queryCache.invalidate('key1');
    
    expect(queryCache.get('key1')).toBeNull();
    expect(queryCache.get('key2')).toBe('value2');
  });

  it('should invalidate by pattern', () => {
    queryCache.set('user:1', { id: 1 }, 60000);
    queryCache.set('user:2', { id: 2 }, 60000);
    queryCache.set('post:1', { id: 1 }, 60000);
    
    queryCache.invalidatePattern('^user:');
    
    expect(queryCache.get('user:1')).toBeNull();
    expect(queryCache.get('user:2')).toBeNull();
    expect(queryCache.get('post:1')).toEqual({ id: 1 });
  });

  it('should clear all cache', () => {
    queryCache.set('key1', 'value1', 60000);
    queryCache.set('key2', 'value2', 60000);
    
    queryCache.clear();
    
    expect(queryCache.get('key1')).toBeNull();
    expect(queryCache.get('key2')).toBeNull();
  });

  it('should return cache stats', () => {
    queryCache.set('key1', 'value1', 60000);
    queryCache.set('key2', 'value2', 60000);
    
    const stats = queryCache.stats();
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(100);
  });
});

describe('withCache helper', () => {
  beforeEach(() => {
    queryCache.clear();
  });

  it('should cache query results', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ data: 'test' });
    
    // First call - should hit the query
    const result1 = await withCache('test-query', mockQuery, 60000);
    expect(result1).toEqual({ data: 'test' });
    expect(mockQuery).toHaveBeenCalledTimes(1);
    
    // Second call - should use cache
    const result2 = await withCache('test-query', mockQuery, 60000);
    expect(result2).toEqual({ data: 'test' });
    expect(mockQuery).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('should use different cache keys', async () => {
    const mockQuery1 = vi.fn().mockResolvedValue({ data: 'test1' });
    const mockQuery2 = vi.fn().mockResolvedValue({ data: 'test2' });
    
    const result1 = await withCache('query1', mockQuery1, 60000);
    const result2 = await withCache('query2', mockQuery2, 60000);
    
    expect(result1).toEqual({ data: 'test1' });
    expect(result2).toEqual({ data: 'test2' });
    expect(mockQuery1).toHaveBeenCalledTimes(1);
    expect(mockQuery2).toHaveBeenCalledTimes(1);
  });
});

describe('CacheTTL constants', () => {
  it('should have predefined TTL values', () => {
    expect(CacheTTL.SHORT).toBe(30000);
    expect(CacheTTL.MEDIUM).toBe(60000);
    expect(CacheTTL.LONG).toBe(300000);
    expect(CacheTTL.VERY_LONG).toBe(1800000);
  });
});
