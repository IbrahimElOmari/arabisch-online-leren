import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';


// Mock the RTL context
const mockIsRTL = vi.fn();

vi.mock('@/contexts/RTLContext', () => ({
  useRTL: () => ({ isRTL: mockIsRTL() }),
}));

import { useRTLLayout } from '@/hooks/useRTLLayout';

describe('useRTLLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LTR mode (isRTL = false)', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(false);
    });

    it('should return isRTL as false', () => {
      const { result } = renderHook(() => useRTLLayout());
      expect(result.current.isRTL).toBe(false);
    });

    describe('getFlexDirection', () => {
      it('should return flex-row for row direction', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getFlexDirection('row')).toBe('flex-row');
      });

      it('should return flex-col for col direction', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getFlexDirection('col')).toBe('flex-col');
      });
    });

    describe('getTextAlign', () => {
      it('should return text-left for left align', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getTextAlign('left')).toBe('text-left');
      });

      it('should return text-right for right align', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getTextAlign('right')).toBe('text-right');
      });

      it('should return text-center for center align', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getTextAlign('center')).toBe('text-center');
      });
    });

    describe('margin/padding utilities', () => {
      it('getMarginStart should return ms-* in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getMarginStart('4')).toBe('ms-4');
      });

      it('getMarginEnd should return me-* in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getMarginEnd('4')).toBe('me-4');
      });

      it('getPaddingStart should return ps-* in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getPaddingStart('4')).toBe('ps-4');
      });

      it('getPaddingEnd should return pe-* in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getPaddingEnd('4')).toBe('pe-4');
      });
    });

    describe('border utilities', () => {
      it('getBorderStart should return border-l in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getBorderStart()).toBe('border-l');
      });

      it('getBorderEnd should return border-r in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getBorderEnd()).toBe('border-r');
      });
    });

    describe('rounded utilities', () => {
      it('getRoundedStart should return rounded-l in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getRoundedStart()).toBe('rounded-l');
      });

      it('getRoundedEnd should return rounded-r in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getRoundedEnd()).toBe('rounded-r');
      });
    });

    describe('position utilities', () => {
      it('getLeftPosition should return left-* in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getLeftPosition('0')).toBe('left-0');
      });

      it('getRightPosition should return right-* in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getRightPosition('0')).toBe('right-0');
      });
    });

    describe('animation utilities', () => {
      it('getSlideDirection should return -translate-x-full for slide in', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getSlideDirection('in')).toBe('-translate-x-full');
      });

      it('getSlideDirection should return translate-x-full for slide out', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getSlideDirection('out')).toBe('translate-x-full');
      });

      it('getTransformDirection should return empty string in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getTransformDirection()).toBe('');
      });
    });

    describe('spacing utilities', () => {
      it('getSpaceX should return space-x-* in LTR', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getSpaceX('4')).toBe('space-x-4');
      });
    });
  });

  describe('RTL mode (isRTL = true)', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(true);
    });

    it('should return isRTL as true', () => {
      const { result } = renderHook(() => useRTLLayout());
      expect(result.current.isRTL).toBe(true);
    });

    describe('getFlexDirection', () => {
      it('should return flex-row-reverse for row direction in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getFlexDirection('row')).toBe('flex-row-reverse');
      });

      it('should still return flex-col for col direction in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getFlexDirection('col')).toBe('flex-col');
      });
    });

    describe('getTextAlign', () => {
      it('should return text-right for left align in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getTextAlign('left')).toBe('text-right');
      });

      it('should return text-left for right align in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getTextAlign('right')).toBe('text-left');
      });
    });

    describe('margin/padding utilities in RTL', () => {
      it('getMarginStart should return me-* in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getMarginStart('4')).toBe('me-4');
      });

      it('getMarginEnd should return ms-* in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getMarginEnd('4')).toBe('ms-4');
      });

      it('getPaddingStart should return pe-* in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getPaddingStart('4')).toBe('pe-4');
      });

      it('getPaddingEnd should return ps-* in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getPaddingEnd('4')).toBe('ps-4');
      });
    });

    describe('border utilities in RTL', () => {
      it('getBorderStart should return border-r in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getBorderStart()).toBe('border-r');
      });

      it('getBorderEnd should return border-l in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getBorderEnd()).toBe('border-l');
      });
    });

    describe('position utilities in RTL', () => {
      it('getLeftPosition should return right-* in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getLeftPosition('0')).toBe('right-0');
      });

      it('getRightPosition should return left-* in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getRightPosition('0')).toBe('left-0');
      });
    });

    describe('animation utilities in RTL', () => {
      it('getSlideDirection should return translate-x-full for slide in', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getSlideDirection('in')).toBe('translate-x-full');
      });

      it('getSlideDirection should return -translate-x-full for slide out', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getSlideDirection('out')).toBe('-translate-x-full');
      });

      it('getTransformDirection should return scale-x-[-1] in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getTransformDirection()).toBe('scale-x-[-1]');
      });
    });

    describe('spacing utilities in RTL', () => {
      it('getSpaceX should include space-x-reverse in RTL', () => {
        const { result } = renderHook(() => useRTLLayout());
        expect(result.current.getSpaceX('4')).toContain('space-x-reverse');
      });
    });
  });
});
