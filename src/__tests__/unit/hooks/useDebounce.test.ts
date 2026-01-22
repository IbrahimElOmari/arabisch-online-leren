import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('should not update value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    rerender({ value: 'updated', delay: 500 });
    
    // Value should still be initial
    expect(result.current).toBe('initial');
    
    // Advance time but not enough
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe('initial');
  });

  it('should update value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    rerender({ value: 'updated', delay: 500 });
    
    // Advance time past the delay
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    // First update
    rerender({ value: 'first', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    // Second update before delay completes
    rerender({ value: 'second', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    // Still should be initial because timer was reset
    expect(result.current).toBe('initial');
    
    // Complete the delay
    act(() => {
      vi.advanceTimersByTime(200);
    });
    
    // Now it should be the latest value
    expect(result.current).toBe('second');
  });

  it('should work with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );
    
    rerender({ value: 'updated', delay: 1000 });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('initial');
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('updated');
  });

  it('should work with numbers', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } }
    );
    
    rerender({ value: 42, delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe(42);
  });

  it('should work with objects', () => {
    const initialObj = { name: 'initial' };
    const updatedObj = { name: 'updated' };
    
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialObj, delay: 500 } }
    );
    
    rerender({ value: updatedObj, delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toEqual(updatedObj);
  });

  it('should work with arrays', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: [1, 2, 3], delay: 500 } }
    );
    
    rerender({ value: [4, 5, 6], delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toEqual([4, 5, 6]);
  });

  it('should cleanup timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    rerender({ value: 'updated', delay: 500 });
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );
    
    rerender({ value: 'updated', delay: 0 });
    
    act(() => {
      vi.advanceTimersByTime(0);
    });
    
    expect(result.current).toBe('updated');
  });

  it('should handle boolean values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: false, delay: 500 } }
    );
    
    rerender({ value: true, delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe(true);
  });

  it('should handle null and undefined', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: null as string | null, delay: 500 } }
    );
    
    expect(result.current).toBe(null);
    
    rerender({ value: 'value', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('value');
  });
});
