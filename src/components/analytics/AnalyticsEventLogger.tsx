import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';

interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, any>;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  timestamp?: string;
}

// Hook for logging analytics events
export const useAnalyticsLogger = () => {
  const { user } = useAuth();

  const logEvent = useCallback(async (eventType: string, eventData: Record<string, any> = {}) => {
    try {
      const analyticsEvent: AnalyticsEvent = {
        event_type: eventType,
        event_data: {
          ...eventData,
          user_agent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          referrer: document.referrer,
        },
        user_id: user?.id,
        session_id: getSessionId(),
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      // Store in localStorage as fallback (since types haven't been regenerated yet)
      storeEventLocally(analyticsEvent);
      
      console.debug('Analytics event logged:', analyticsEvent);
    } catch (error) {
      console.warn('Analytics logging error:', error);
      storeEventLocally({ event_type: eventType, event_data: eventData, timestamp: new Date().toISOString() });
    }
  }, [user?.id]);

  return { logEvent };
};

// Session ID generator
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Fallback storage for events
const storeEventLocally = (event: any) => {
  try {
    const existingEvents = JSON.parse(localStorage.getItem('analytics_events_offline') || '[]');
    existingEvents.push(event);
    // Keep only last 100 events
    const recentEvents = existingEvents.slice(-100);
    localStorage.setItem('analytics_events_offline', JSON.stringify(recentEvents));
  } catch (error) {
    console.warn('Failed to store event locally:', error);
  }
};

// Component for automatic page view tracking
export const PageViewTracker: React.FC = () => {
  const { logEvent } = useAnalyticsLogger();

  useEffect(() => {
    // Log page view
    logEvent('page_view', {
      page: window.location.pathname,
      title: document.title,
      load_time: performance.now(),
    });

    // Log page unload
    const handleBeforeUnload = () => {
      logEvent('page_unload', {
        page: window.location.pathname,
        time_on_page: performance.now(),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [logEvent]);

  return null;
};

// Component for user interaction tracking
export const InteractionTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logEvent } = useAnalyticsLogger();

  useEffect(() => {
    // Track clicks
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.role === 'button') {
        logEvent('button_click', {
          button_text: target.textContent?.trim() || 'Unknown',
          button_id: target.id || null,
          button_class: target.className || null,
          page: window.location.pathname,
        });
      }
    };

    // Track form submissions
    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      logEvent('form_submit', {
        form_id: form.id || null,
        form_action: form.action || null,
        page: window.location.pathname,
      });
    };

    // Track link clicks
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLAnchorElement;
      if (target.tagName === 'A') {
        logEvent('link_click', {
          link_url: target.href,
          link_text: target.textContent?.trim() || 'Unknown',
          is_external: !target.href.includes(window.location.origin),
          page: window.location.pathname,
        });
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('click', handleLinkClick);
    document.addEventListener('submit', handleSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('submit', handleSubmit);
    };
  }, [logEvent]);

  return <>{children}</>;
};

// Custom events for specific actions
export const useCustomAnalytics = () => {
  const { logEvent } = useAnalyticsLogger();

  const trackEnrollment = useCallback((classId: string, className: string) => {
    logEvent('class_enrollment', {
      class_id: classId,
      class_name: className,
      enrollment_timestamp: new Date().toISOString(),
    });
  }, [logEvent]);

  const trackQuizCompletion = useCallback((quizId: string, score: number, timeSpent: number) => {
    logEvent('quiz_completion', {
      quiz_id: quizId,
      score,
      time_spent_seconds: timeSpent,
      completion_timestamp: new Date().toISOString(),
    });
  }, [logEvent]);

  const trackTaskSubmission = useCallback((taskId: string, submissionType: string) => {
    logEvent('task_submission', {
      task_id: taskId,
      submission_type: submissionType,
      submission_timestamp: new Date().toISOString(),
    });
  }, [logEvent]);

  const trackForumPost = useCallback((threadId: string, postLength: number) => {
    logEvent('forum_post', {
      thread_id: threadId,
      post_length: postLength,
      post_timestamp: new Date().toISOString(),
    });
  }, [logEvent]);

  const trackVideoProgress = useCallback((videoId: string, progressPercentage: number, watchTime: number) => {
    logEvent('video_progress', {
      video_id: videoId,
      progress_percentage: progressPercentage,
      watch_time_seconds: watchTime,
      timestamp: new Date().toISOString(),
    });
  }, [logEvent]);

  const trackSearchQuery = useCallback((query: string, resultsCount: number) => {
    logEvent('search_query', {
      query: query.toLowerCase(), // Anonymize somewhat
      results_count: resultsCount,
      search_timestamp: new Date().toISOString(),
    });
  }, [logEvent]);

  const trackError = useCallback((errorType: string, errorMessage: string, errorLocation: string) => {
    logEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      error_location: errorLocation,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, [logEvent]);

  return {
    trackEnrollment,
    trackQuizCompletion,
    trackTaskSubmission,
    trackForumPost,
    trackVideoProgress,
    trackSearchQuery,
    trackError,
  };
};

export default PageViewTracker;
