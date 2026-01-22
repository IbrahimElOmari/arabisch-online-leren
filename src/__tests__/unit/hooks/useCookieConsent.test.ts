import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock supabase before importing the hook
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// Import after mocking
import { useCookieConsent } from '@/hooks/useCookieConsent';

describe('useCookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset zustand store state
    useCookieConsent.setState({
      hasConsented: false,
      consentDate: null,
      categories: {
        essential: true,
        analytics: false,
        marketing: false,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have default values with essential enabled', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      expect(result.current.hasConsented).toBe(false);
      expect(result.current.consentDate).toBeNull();
      expect(result.current.categories.essential).toBe(true);
      expect(result.current.categories.analytics).toBe(false);
      expect(result.current.categories.marketing).toBe(false);
    });
  });

  describe('acceptAll', () => {
    it('should enable all cookie categories', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      act(() => {
        result.current.acceptAll();
      });
      
      expect(result.current.hasConsented).toBe(true);
      expect(result.current.categories.essential).toBe(true);
      expect(result.current.categories.analytics).toBe(true);
      expect(result.current.categories.marketing).toBe(true);
      expect(result.current.consentDate).not.toBeNull();
    });

    it('should set consent date', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      act(() => {
        result.current.acceptAll();
      });
      
      expect(result.current.consentDate).toBeTruthy();
      // Verify it's a valid ISO date
      expect(new Date(result.current.consentDate!).toISOString()).toBe(result.current.consentDate);
    });
  });

  describe('acceptEssentialOnly', () => {
    it('should only enable essential cookies', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      // First accept all
      act(() => {
        result.current.acceptAll();
      });
      
      // Then reset to essential only
      act(() => {
        result.current.acceptEssentialOnly();
      });
      
      expect(result.current.hasConsented).toBe(true);
      expect(result.current.categories.essential).toBe(true);
      expect(result.current.categories.analytics).toBe(false);
      expect(result.current.categories.marketing).toBe(false);
    });
  });

  describe('updateCategory', () => {
    it('should update analytics category', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      act(() => {
        result.current.updateCategory('analytics', true);
      });
      
      expect(result.current.categories.analytics).toBe(true);
    });

    it('should update marketing category', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      act(() => {
        result.current.updateCategory('marketing', true);
      });
      
      expect(result.current.categories.marketing).toBe(true);
    });

    it('should NOT allow disabling essential cookies', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      act(() => {
        result.current.updateCategory('essential', false);
      });
      
      // Essential must remain true
      expect(result.current.categories.essential).toBe(true);
    });

    it('should toggle categories correctly', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      act(() => {
        result.current.updateCategory('analytics', true);
      });
      expect(result.current.categories.analytics).toBe(true);
      
      act(() => {
        result.current.updateCategory('analytics', false);
      });
      expect(result.current.categories.analytics).toBe(false);
    });
  });

  describe('resetConsent', () => {
    it('should reset to default state', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      // First accept all
      act(() => {
        result.current.acceptAll();
      });
      
      expect(result.current.hasConsented).toBe(true);
      
      // Then reset
      act(() => {
        result.current.resetConsent();
      });
      
      expect(result.current.hasConsented).toBe(false);
      expect(result.current.consentDate).toBeNull();
      expect(result.current.categories.essential).toBe(true);
      expect(result.current.categories.analytics).toBe(false);
      expect(result.current.categories.marketing).toBe(false);
    });
  });

  describe('helper functions', () => {
    it('isAnalyticsEnabled should return correct value', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      expect(result.current.isAnalyticsEnabled()).toBe(false);
      
      act(() => {
        result.current.updateCategory('analytics', true);
      });
      
      expect(result.current.isAnalyticsEnabled()).toBe(true);
    });

    it('isMarketingEnabled should return correct value', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      expect(result.current.isMarketingEnabled()).toBe(false);
      
      act(() => {
        result.current.updateCategory('marketing', true);
      });
      
      expect(result.current.isMarketingEnabled()).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should persist consent to localStorage', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      act(() => {
        result.current.acceptAll();
      });
      
      const stored = localStorage.getItem('cookie-consent');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.hasConsented).toBe(true);
      expect(parsed.state.categories.analytics).toBe(true);
    });
  });
});
