import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the RTL context
const mockIsRTL = vi.fn();

vi.mock('@/contexts/RTLContext', () => ({
  useRTL: () => ({ isRTL: mockIsRTL() }),
}));

// Mock arabicUtils
vi.mock('@/utils/arabicUtils', () => ({
  toArabicNumerals: (str: string) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, (d) => arabicDigits[parseInt(d)]);
  },
  formatArabicDate: (date: Date) => {
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const day = date.getDate().toString().replace(/[0-9]/g, d => arabicDigits[parseInt(d)]);
    const year = date.getFullYear().toString().replace(/[0-9]/g, d => arabicDigits[parseInt(d)]);
    return `${day} ${arabicMonths[date.getMonth()]} ${year}`;
  },
  formatArabicTime: (date: Date) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const hours = date.getHours().toString().padStart(2, '0').replace(/[0-9]/g, d => arabicDigits[parseInt(d)]);
    const minutes = date.getMinutes().toString().padStart(2, '0').replace(/[0-9]/g, d => arabicDigits[parseInt(d)]);
    return `${hours}:${minutes}`;
  },
  formatArabicPercentage: (value: number) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return `${Math.round(value).toString().replace(/[0-9]/g, d => arabicDigits[parseInt(d)])}٪`;
  },
}));

import { useArabicNumerals } from '@/hooks/useArabicNumerals';

describe('useArabicNumerals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LTR mode (isRTL = false)', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(false);
    });

    it('should return isRTL as false', () => {
      const { result } = renderHook(() => useArabicNumerals());
      expect(result.current.isRTL).toBe(false);
    });

    describe('formatNumber', () => {
      it('should return Western numerals in LTR', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatNumber(123)).toBe('123');
      });

      it('should handle string input', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatNumber('456')).toBe('456');
      });
    });

    describe('formatPercentage', () => {
      it('should return Western percentage format', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatPercentage(75)).toBe('75%');
      });

      it('should round decimals', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatPercentage(75.7)).toBe('76%');
      });
    });

    describe('formatDate', () => {
      it('should format date in Dutch', () => {
        const { result } = renderHook(() => useArabicNumerals());
        const date = new Date(2024, 0, 15); // January 15, 2024
        const formatted = result.current.formatDate(date);
        expect(formatted).toContain('15');
        expect(formatted).toContain('2024');
      });
    });

    describe('formatTime', () => {
      it('should format time in 24-hour format', () => {
        const { result } = renderHook(() => useArabicNumerals());
        const date = new Date(2024, 0, 15, 14, 30);
        const formatted = result.current.formatTime(date);
        expect(formatted).toContain('14');
        expect(formatted).toContain('30');
      });
    });

    describe('formatOrdinal', () => {
      it('should format Dutch ordinals', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatOrdinal(1)).toBe('1ste');
        expect(result.current.formatOrdinal(2)).toBe('2de');
        expect(result.current.formatOrdinal(3)).toBe('3de');
      });
    });

    describe('formatDuration', () => {
      it('should format minutes in Dutch', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatDuration(30)).toBe('30 min');
      });

      it('should format hours in Dutch', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatDuration(60)).toBe('1 uur');
      });

      it('should format hours and minutes', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatDuration(90)).toBe('1u 30m');
      });
    });

    describe('formatFileSize', () => {
      it('should format bytes', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatFileSize(500)).toContain('500');
        expect(result.current.formatFileSize(500)).toContain('B');
      });

      it('should format kilobytes', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatFileSize(1024)).toContain('KB');
      });

      it('should format megabytes', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatFileSize(1024 * 1024)).toContain('MB');
      });
    });

    describe('formatCount', () => {
      it('should use singular form for 1', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatCount(1, 'student', 'studenten', 'طالب', 'طلاب')).toBe('1 student');
      });

      it('should use plural form for > 1', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatCount(5, 'student', 'studenten', 'طالب', 'طلاب')).toBe('5 studenten');
      });
    });
  });

  describe('RTL mode (isRTL = true)', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(true);
    });

    it('should return isRTL as true', () => {
      const { result } = renderHook(() => useArabicNumerals());
      expect(result.current.isRTL).toBe(true);
    });

    describe('formatNumber', () => {
      it('should return Arabic numerals in RTL', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatNumber(123)).toBe('١٢٣');
      });

      it('should convert all digits', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatNumber(1234567890)).toBe('١٢٣٤٥٦٧٨٩٠');
      });
    });

    describe('formatPercentage', () => {
      it('should return Arabic percentage format', () => {
        const { result } = renderHook(() => useArabicNumerals());
        const formatted = result.current.formatPercentage(75);
        expect(formatted).toContain('٧٥');
        expect(formatted).toContain('٪');
      });
    });

    describe('formatDate', () => {
      it('should format date in Arabic', () => {
        const { result } = renderHook(() => useArabicNumerals());
        const date = new Date(2024, 0, 15);
        const formatted = result.current.formatDate(date);
        expect(formatted).toContain('يناير'); // Arabic for January
      });
    });

    describe('formatOrdinal', () => {
      it('should return Arabic ordinals for known numbers', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatOrdinal(1)).toBe('الأول');
        expect(result.current.formatOrdinal(2)).toBe('الثاني');
        expect(result.current.formatOrdinal(3)).toBe('الثالث');
      });
    });

    describe('formatDuration', () => {
      it('should format minutes in Arabic', () => {
        const { result } = renderHook(() => useArabicNumerals());
        const formatted = result.current.formatDuration(30);
        expect(formatted).toContain('٣٠');
        expect(formatted).toContain('دقيقة');
      });

      it('should format hours in Arabic', () => {
        const { result } = renderHook(() => useArabicNumerals());
        const formatted = result.current.formatDuration(60);
        expect(formatted).toContain('١');
        expect(formatted).toContain('ساعة');
      });
    });

    describe('formatFileSize', () => {
      it('should use Arabic units', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatFileSize(1024)).toContain('كيلوبايت');
      });
    });

    describe('formatCount', () => {
      it('should use Arabic forms', () => {
        const { result } = renderHook(() => useArabicNumerals());
        expect(result.current.formatCount(1, 'student', 'studenten', 'طالب', 'طلاب')).toContain('طالب');
        expect(result.current.formatCount(5, 'student', 'studenten', 'طالب', 'طلاب')).toContain('طلاب');
      });
    });
  });
});
