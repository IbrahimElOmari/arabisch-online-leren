import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the RTL context
const mockIsRTL = vi.fn();

vi.mock('@/contexts/RTLContext', () => ({
  useRTL: () => ({ isRTL: mockIsRTL() }),
}));

// Mock the Translation context
vi.mock('@/contexts/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'aria.navigation': 'التنقل الرئيسي',
        'aria.rtlMode': 'وضع RTL',
        'aria.skipToContent': 'تخطي إلى المحتوى',
        'aria.keyboardRTL': 'تنقل لوحة المفاتيح RTL',
        'aria.keyboardLTR': 'Keyboard navigation LTR',
        'aria.dataTable': 'جدول البيانات',
        'aria.button.submit': 'إرسال',
      };
      return translations[key] || key;
    },
  }),
}));

import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';

describe('useAccessibilityRTL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LTR mode', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(false);
    });

    it('should return isRTL as false', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      expect(result.current.isRTL).toBe(false);
    });

    describe('getAriaFlowDirection', () => {
      it('should return ltr', () => {
        const { result } = renderHook(() => useAccessibilityRTL());
        expect(result.current.getAriaFlowDirection()).toBe('ltr');
      });
    });

    describe('getFocusClasses', () => {
      it('should return focus-ltr', () => {
        const { result } = renderHook(() => useAccessibilityRTL());
        expect(result.current.getFocusClasses()).toBe('focus-ltr');
      });
    });

    describe('getSkipLinkText', () => {
      it('should return English skip link text', () => {
        const { result } = renderHook(() => useAccessibilityRTL());
        expect(result.current.getSkipLinkText()).toBe('Skip to main content');
      });
    });

    describe('getKeyboardNavigation', () => {
      it('should return LTR keyboard attributes', () => {
        const { result } = renderHook(() => useAccessibilityRTL());
        const attrs = result.current.getKeyboardNavigation();
        expect(attrs['data-orientation']).toBe('ltr');
      });
    });
  });

  describe('RTL mode', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(true);
    });

    it('should return isRTL as true', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      expect(result.current.isRTL).toBe(true);
    });

    describe('getAriaFlowDirection', () => {
      it('should return rtl', () => {
        const { result } = renderHook(() => useAccessibilityRTL());
        expect(result.current.getAriaFlowDirection()).toBe('rtl');
      });
    });

    describe('getFocusClasses', () => {
      it('should return focus-rtl', () => {
        const { result } = renderHook(() => useAccessibilityRTL());
        expect(result.current.getFocusClasses()).toBe('focus-rtl');
      });
    });

    describe('getSkipLinkText', () => {
      it('should return Arabic skip link text', () => {
        const { result } = renderHook(() => useAccessibilityRTL());
        expect(result.current.getSkipLinkText()).toBe('تخطي إلى المحتوى');
      });
    });

    describe('getKeyboardNavigation', () => {
      it('should return RTL keyboard attributes', () => {
        const { result } = renderHook(() => useAccessibilityRTL());
        const attrs = result.current.getKeyboardNavigation();
        expect(attrs['data-orientation']).toBe('rtl');
      });
    });
  });

  describe('getNavigationAttributes', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(false);
    });

    it('should return navigation role', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      const attrs = result.current.getNavigationAttributes();
      expect(attrs.role).toBe('navigation');
    });

    it('should return aria-label', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      const attrs = result.current.getNavigationAttributes();
      expect(attrs['aria-label']).toBeTruthy();
    });
  });

  describe('getFormAttributes', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(false);
    });

    it('should return form field attributes', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      const attrs = result.current.getFormAttributes('email');
      
      expect(attrs['aria-describedby']).toBe('email-description');
      expect(attrs['aria-required']).toBe('true');
    });
  });

  describe('getTableAttributes', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(false);
    });

    it('should return table role', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      const attrs = result.current.getTableAttributes();
      
      expect(attrs.role).toBe('table');
      expect(attrs['aria-label']).toBeTruthy();
    });
  });

  describe('getLiveRegionAttributes', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(false);
    });

    it('should return live region attributes', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      const attrs = result.current.getLiveRegionAttributes();
      
      expect(attrs['aria-live']).toBe('polite');
      expect(attrs['aria-atomic']).toBe('true');
      expect(attrs.role).toBe('status');
    });
  });

  describe('getDialogAttributes', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(false);
    });

    it('should return dialog attributes', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      const attrs = result.current.getDialogAttributes('settings');
      
      expect(attrs.role).toBe('dialog');
      expect(attrs['aria-modal']).toBe(true);
      expect(attrs['aria-labelledby']).toBe('dialog-title-settings');
    });
  });

  describe('getButtonAttributes', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(false);
    });

    it('should return button attributes', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      const attrs = result.current.getButtonAttributes('submit');
      
      expect(attrs.type).toBe('button');
      expect(attrs['aria-label']).toBeTruthy();
    });
  });

  describe('getScreenReaderText', () => {
    it('should append RTL mode indicator in RTL', () => {
      mockIsRTL.mockReturnValue(true);
      const { result } = renderHook(() => useAccessibilityRTL());
      const text = result.current.getScreenReaderText('Hello');
      
      expect(text).toContain('Hello');
      expect(text).toContain('وضع RTL');
    });

    it('should return plain text in LTR', () => {
      mockIsRTL.mockReturnValue(false);
      const { result } = renderHook(() => useAccessibilityRTL());
      const text = result.current.getScreenReaderText('Hello');
      
      expect(text).toBe('Hello');
    });
  });

  describe('getAriaLabel', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(true);
    });

    it('should return translated label in RTL', () => {
      const { result } = renderHook(() => useAccessibilityRTL());
      const label = result.current.getAriaLabel('navigation', 'Main navigation');
      
      // In RTL mode, it should prefer the translated version
      expect(label).toBeTruthy();
    });
  });
});
