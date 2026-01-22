import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-session-id-12345',
});

import { useAnalytics } from '@/hooks/useAnalytics';

describe('useAnalytics', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset zustand store
    useAnalytics.setState({
      events: [],
      sessionId: 'test-session-id-12345',
      userId: null,
      isEnabled: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have a session ID', () => {
      const { result } = renderHook(() => useAnalytics());
      
      expect(result.current.sessionId).toBeTruthy();
      expect(typeof result.current.sessionId).toBe('string');
    });

    it('should be enabled by default', () => {
      const { result } = renderHook(() => useAnalytics());
      
      expect(result.current.isEnabled).toBe(true);
    });

    it('should have empty events array', () => {
      const { result } = renderHook(() => useAnalytics());
      
      expect(result.current.events).toEqual([]);
    });

    it('should have null userId initially', () => {
      const { result } = renderHook(() => useAnalytics());
      
      expect(result.current.userId).toBeNull();
    });
  });

  describe('setUserId', () => {
    it('should set user ID', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.setUserId('user-123');
      });
      
      expect(result.current.userId).toBe('user-123');
    });

    it('should clear user ID when set to null', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.setUserId('user-123');
      });
      
      act(() => {
        result.current.setUserId(null);
      });
      
      expect(result.current.userId).toBeNull();
    });
  });

  describe('setEnabled', () => {
    it('should disable analytics', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.setEnabled(false);
      });
      
      expect(result.current.isEnabled).toBe(false);
    });

    it('should re-enable analytics', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.setEnabled(false);
      });
      
      act(() => {
        result.current.setEnabled(true);
      });
      
      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe('trackEvent', () => {
    it('should not track when disabled', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.setEnabled(false);
      });
      
      act(() => {
        result.current.trackEvent('test_event', { key: 'value' });
      });
      
      expect(result.current.events.length).toBe(0);
    });

    it('should track essential events even without consent', () => {
      const { result } = renderHook(() => useAnalytics());
      
      // No consent stored in localStorage
      act(() => {
        result.current.trackEvent('essential_login', { success: true });
      });
      
      // Essential events should be tracked
      expect(result.current.events.length).toBe(1);
      expect(result.current.events[0].eventName).toBe('essential_login');
    });

    it('should track page_view as essential event', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackEvent('page_view', { path: '/dashboard' });
      });
      
      expect(result.current.events.length).toBe(1);
      expect(result.current.events[0].eventName).toBe('page_view');
    });
  });

  describe('trackPageView', () => {
    it('should track page view with path', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackPageView('/dashboard');
      });
      
      expect(result.current.events.length).toBe(1);
      expect(result.current.events[0].properties.path).toBe('/dashboard');
    });
  });

  describe('trackUserAction', () => {
    it('should track user action', () => {
      // Set consent first
      localStorage.setItem('cookie-consent', JSON.stringify({
        state: { categories: { analytics: true } }
      }));
      
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackUserAction('button_click', 'header');
      });
      
      expect(result.current.events.length).toBe(1);
      expect(result.current.events[0].properties.action).toBe('button_click');
      expect(result.current.events[0].properties.context).toBe('header');
    });
  });

  describe('trackLearningProgress', () => {
    it('should track learning progress', () => {
      localStorage.setItem('cookie-consent', JSON.stringify({
        state: { categories: { analytics: true } }
      }));
      
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackLearningProgress('level-1', 75);
      });
      
      expect(result.current.events.length).toBe(1);
      expect(result.current.events[0].properties.level).toBe('level-1');
      expect(result.current.events[0].properties.progress).toBe(75);
    });
  });

  describe('trackForumActivity', () => {
    it('should track forum post', () => {
      localStorage.setItem('cookie-consent', JSON.stringify({
        state: { categories: { analytics: true } }
      }));
      
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackForumActivity('post', 'post-123');
      });
      
      expect(result.current.events.length).toBe(1);
      expect(result.current.events[0].properties.activity).toBe('post');
      expect(result.current.events[0].properties.postId).toBe('post-123');
    });
  });

  describe('trackClassEnrollment', () => {
    it('should track class enrollment', () => {
      localStorage.setItem('cookie-consent', JSON.stringify({
        state: { categories: { analytics: true } }
      }));
      
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackClassEnrollment('class-123', 'Arabisch Beginners');
      });
      
      expect(result.current.events.length).toBe(1);
      expect(result.current.events[0].properties.classId).toBe('class-123');
      expect(result.current.events[0].properties.className).toBe('Arabisch Beginners');
    });
  });

  describe('getEvents', () => {
    it('should return all tracked events', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackPageView('/page1');
        result.current.trackPageView('/page2');
      });
      
      const events = result.current.getEvents();
      expect(events.length).toBe(2);
    });
  });

  describe('clearEvents', () => {
    it('should clear all events', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        result.current.trackPageView('/page1');
      });
      
      expect(result.current.events.length).toBe(1);
      
      act(() => {
        result.current.clearEvents();
      });
      
      expect(result.current.events.length).toBe(0);
    });
  });

  describe('event limit', () => {
    it('should keep max 100 events', () => {
      const { result } = renderHook(() => useAnalytics());
      
      act(() => {
        for (let i = 0; i < 110; i++) {
          result.current.trackPageView(`/page${i}`);
        }
      });
      
      expect(result.current.events.length).toBeLessThanOrEqual(100);
    });
  });
});
