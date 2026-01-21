import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

interface AnalyticsStore {
  events: AnalyticsEvent[];
  sessionId: string;
  userId: string | null;
  isEnabled: boolean;
  
  // Actions
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  setUserId: (userId: string | null) => void;
  setEnabled: (enabled: boolean) => void;
  getEvents: () => AnalyticsEvent[];
  clearEvents: () => void;
  
  // Engagement tracking
  trackPageView: (path: string) => void;
  trackUserAction: (action: string, context?: string) => void;
  trackLearningProgress: (level: string, progress: number) => void;
  trackForumActivity: (activity: 'post' | 'reply' | 'like', postId?: string) => void;
  trackClassEnrollment: (classId: string, className: string) => void;
}

// Generate a secure session ID
const generateSessionId = () => {
  return crypto.randomUUID();
};

// Check if analytics consent is given
const hasAnalyticsConsent = (): boolean => {
  try {
    const stored = localStorage.getItem('cookie-consent');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return parsed?.state?.categories?.analytics === true;
  } catch {
    return false;
  }
};

// Persist event to database
const persistEventToDatabase = async (event: {
  event_type: string;
  event_data: Record<string, any>;
  user_id: string | null;
  session_id: string;
  page_url: string;
}) => {
  try {
    const { error } = await supabase.from('analytics_events').insert({
      event_type: event.event_type,
      event_data: event.event_data,
      user_id: event.user_id,
      session_id: event.session_id,
      page_url: event.page_url,
    });
    
    if (error) {
      console.warn('Failed to persist analytics event:', error.message);
      // Fallback: store in localStorage for later sync
      storeEventLocally(event);
    }
  } catch (err) {
    console.warn('Analytics persistence error:', err);
    storeEventLocally(event);
  }
};

// Store event locally as fallback
const storeEventLocally = (event: any) => {
  try {
    const stored = localStorage.getItem('pending_analytics_events');
    const events = stored ? JSON.parse(stored) : [];
    events.push({ ...event, stored_at: new Date().toISOString() });
    // Keep max 100 events locally
    if (events.length > 100) events.shift();
    localStorage.setItem('pending_analytics_events', JSON.stringify(events));
  } catch (e) {
    // Silently fail if localStorage is not available
  }
};

// Sync pending events when online
const syncPendingEvents = async () => {
  try {
    const stored = localStorage.getItem('pending_analytics_events');
    if (!stored) return;
    
    const events = JSON.parse(stored);
    if (events.length === 0) return;
    
    // Remove stored_at field before inserting
    const cleanEvents = events.map((e: any) => {
      const { stored_at, ...rest } = e;
      return rest;
    });
    
    const { error } = await supabase.from('analytics_events').insert(cleanEvents);
    
    if (!error) {
      localStorage.removeItem('pending_analytics_events');
    }
  } catch (e) {
    // Silently fail
  }
};

// Try to sync pending events on load
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncPendingEvents);
  // Initial sync attempt after a short delay
  setTimeout(syncPendingEvents, 2000);
}

export const useAnalytics = create<AnalyticsStore>((set, get) => ({
  events: [],
  sessionId: generateSessionId(),
  userId: null,
  isEnabled: true,

  trackEvent: (eventName: string, properties = {}) => {
    const state = get();
    if (!state.isEnabled) return;

    // Check cookie consent for analytics (essential events always allowed)
    const isEssentialEvent = eventName.startsWith('essential_') || eventName === 'page_view';
    if (!hasAnalyticsConsent() && !isEssentialEvent) {
      if (import.meta.env.DEV) {
        console.log('Analytics blocked (no consent):', eventName);
      }
      return;
    }

    const event: AnalyticsEvent = {
      eventName,
      properties,
      timestamp: new Date(),
      userId: state.userId || undefined,
      sessionId: state.sessionId,
    };

    // Add to local state (keep last 100)
    set((state) => ({
      events: [...state.events.slice(-99), event],
    }));

    // Persist to database
    persistEventToDatabase({
      event_type: eventName,
      event_data: {
        ...properties,
        user_agent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        referrer: document.referrer || null,
        language: navigator.language,
      },
      user_id: state.userId,
      session_id: state.sessionId,
      page_url: window.location.pathname,
    });

    // Log in development
    if (import.meta.env.DEV) {
      console.log('Analytics Event:', event);
    }
  },

  setUserId: (userId: string | null) => {
    set({ userId });
    // Track user identification
    if (userId) {
      get().trackEvent('user_identified', { userId });
    }
  },

  setEnabled: (enabled: boolean) => {
    set({ isEnabled: enabled });
  },

  getEvents: () => {
    return get().events;
  },

  clearEvents: () => {
    set({ events: [] });
  },

  trackPageView: (path: string) => {
    get().trackEvent('page_view', { path, title: document.title });
  },

  trackUserAction: (action: string, context?: string) => {
    get().trackEvent('user_action', { action, context });
  },

  trackLearningProgress: (level: string, progress: number) => {
    get().trackEvent('learning_progress', { level, progress });
  },

  trackForumActivity: (activity: 'post' | 'reply' | 'like', postId?: string) => {
    get().trackEvent('forum_activity', { activity, postId });
  },

  trackClassEnrollment: (classId: string, className: string) => {
    get().trackEvent('class_enrollment', { classId, className });
  },
}));

// Hook to use analytics in components
export const useAnalyticsTracking = () => {
  const analytics = useAnalytics();

  return {
    trackEvent: analytics.trackEvent,
    trackPageView: analytics.trackPageView,
    trackUserAction: analytics.trackUserAction,
    trackLearningProgress: analytics.trackLearningProgress,
    trackForumActivity: analytics.trackForumActivity,
    trackClassEnrollment: analytics.trackClassEnrollment,
  };
};
