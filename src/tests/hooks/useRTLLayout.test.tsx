import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { RTLProvider } from '@/contexts/RTLContext';
import { ReactNode } from 'react';

describe('useRTLLayout', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RTLProvider>{children}</RTLProvider>
  );

  it('should return RTL utilities', () => {
    const { result } = renderHook(() => useRTLLayout(), { wrapper });
    
    expect(result.current).toHaveProperty('isRTL');
    expect(result.current).toHaveProperty('getFlexDirection');
    expect(result.current).toHaveProperty('getTextAlign');
    expect(result.current).toHaveProperty('getFloat');
  });

  it('should return correct flex direction for LTR', () => {
    const { result } = renderHook(() => useRTLLayout(), { wrapper });
    
    const flexDir = result.current.getFlexDirection();
    expect(flexDir).toBe('flex');
  });

  it('should return correct text alignment', () => {
    const { result } = renderHook(() => useRTLLayout(), { wrapper });
    
    const textAlign = result.current.getTextAlign();
    expect(['text-left', 'text-right', 'text-start', 'text-end']).toContain(textAlign);
  });

  it('should provide margin utilities', () => {
    const { result } = renderHook(() => useRTLLayout(), { wrapper });
    
    const marginStart = result.current.getMarginStart('4');
    const marginEnd = result.current.getMarginEnd('4');
    
    expect(typeof marginStart).toBe('string');
    expect(typeof marginEnd).toBe('string');
  });
});
