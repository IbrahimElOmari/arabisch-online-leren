import { create } from 'zustand';

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
  // Use the Web Crypto API for a cryptographically secure UUID
  return crypto.randomUUID();
};

export const useAnalytics = create<AnalyticsStore>((set, get) => ({
  events: [],
  sessionId: generateSessionId(),
  userId: null,
  isEnabled: true,

  trackEvent: (eventName: string, properties = {}) => {
    const state = get();
    if (!state.isEnabled) return;

    const event: AnalyticsEvent = {
      eventName,
      properties,
      timestamp: new Date(),
      userId: state.userId || undefined,
      sessionId: state.sessionId,
    };

    set((state) => ({
      events: [...state.events, event],
    }));

    // In production, send to analytics service; in dev, log
    if (import.meta.env.DEV) {
      console.log('Analytics Event:', event);
    }
  },

  setUserId: (userId: string | null) => {
    set({ userId });
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
    get().trackEvent('page_view', { path });
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