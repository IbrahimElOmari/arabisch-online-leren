import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useAnalyticsTracking } from '@/hooks/useAnalytics';

const AnalyticsTracker = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { trackPageView, trackEvent } = useAnalyticsTracking();

  // Track page views
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname, trackPageView]);

  // Track user login/logout
  useEffect(() => {
    if (user) {
      trackEvent('user_login', { 
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [user, trackEvent]);

  return null; // This component doesn't render anything
};

export default AnalyticsTracker;
