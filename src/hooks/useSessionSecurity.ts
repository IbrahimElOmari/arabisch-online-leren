import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useToast } from '@/hooks/use-toast';
import { SECURITY_CONFIG } from '@/config/security';
import { securityLogger } from '@/utils/securityLogger';

interface SessionState {
  isActive: boolean;
  timeUntilWarning: number;
  timeUntilExpiry: number;
  showWarning: boolean;
  lastActivity: number;
}

interface SessionMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  suspiciousActivity: number;
}

export const useSessionSecurity = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    timeUntilWarning: 0,
    timeUntilExpiry: 0,
    showWarning: false,
    lastActivity: Date.now()
  });

  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalSessions: 0,
    averageSessionDuration: 0,
    suspiciousActivity: 0
  });

  const activityTimeoutRef = useRef<NodeJS.Timeout>();
  const warningShownRef = useRef(false);
  const sessionStartRef = useRef(Date.now());

  const updateActivity = useCallback(() => {
    const now = Date.now();
    setSessionState(prev => ({ 
      ...prev, 
      lastActivity: now,
      showWarning: false 
    }));
    warningShownRef.current = false;
    
    // Log suspicious rapid activity
    const timeSinceLastActivity = now - sessionState.lastActivity;
    if (timeSinceLastActivity < 100) { // Less than 100ms between activities
      securityLogger.logSuspiciousActivity('rapid_activity', {
        time_between_activities: timeSinceLastActivity,
        session_duration: now - sessionStartRef.current
      });
    }
  }, [sessionState.lastActivity]);

  // Enhanced activity tracking
  useEffect(() => {
    if (!user) return;

    const events = [
      'mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 
      'touchstart', 'click', 'focus', 'blur'
    ];
    
    const throttledUpdateActivity = (() => {
      let lastCall = 0;
      return () => {
        const now = Date.now();
        if (now - lastCall >= 1000) { // Throttle to once per second
          lastCall = now;
          updateActivity();
        }
      };
    })();
    
    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, { passive: true });
    });

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, updateActivity]);

  // Session timeout management with enhanced warnings
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const now = Date.now();
      const timeSinceActivity = now - sessionState.lastActivity;
      const warningTime = SECURITY_CONFIG.session.timeoutWarningMinutes * 60 * 1000;
      const expireTime = SECURITY_CONFIG.session.maxIdleMinutes * 60 * 1000;

      const timeUntilWarning = Math.max(0, warningTime - timeSinceActivity);
      const timeUntilExpiry = Math.max(0, expireTime - timeSinceActivity);

      setSessionState(prev => ({
        ...prev,
        isActive: timeSinceActivity < expireTime,
        timeUntilWarning,
        timeUntilExpiry,
        showWarning: timeSinceActivity >= warningTime && timeSinceActivity < expireTime
      }));

      // Auto logout if session expired
      if (timeSinceActivity >= expireTime) {
        securityLogger.logAuthAttempt(false, user.email, {
          reason: 'session_timeout',
          session_duration: now - sessionStartRef.current
        });
        
        toast({
          title: "Sessie verlopen",
          description: "Je bent automatisch uitgelogd wegens inactiviteit van 30 minuten.",
          variant: "destructive",
          duration: 5000
        });
        signOut();
        return;
      }

      // Show progressive warnings
      if (timeSinceActivity >= warningTime && timeSinceActivity < expireTime && !warningShownRef.current) {
        warningShownRef.current = true;
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        
        toast({
          title: "Sessie verloopt binnenkort",
          description: `Je sessie verloopt over ${minutesLeft} ${minutesLeft === 1 ? 'minuut' : 'minuten'}. Klik ergens om te verlengen.`,
          variant: "destructive",
          duration: 8000
        });
      }
    };

    const interval = setInterval(checkSession, 10000); // Check every 10 seconds for better UX
    
    return () => clearInterval(interval);
  }, [user, sessionState.lastActivity, toast, signOut]);

  const extendSession = useCallback(() => {
    updateActivity();
    
    securityLogger.logSuspiciousActivity('session_extended', {
      manual_extension: true,
      session_duration: Date.now() - sessionStartRef.current
    });
    
    toast({
      title: "Sessie verlengd",
      description: "Je sessie is succesvol verlengd voor nog eens 30 minuten.",
    });
  }, [updateActivity, toast]);

  const getSessionHealth = useCallback((): 'healthy' | 'warning' | 'critical' => {
    const timeSinceActivity = Date.now() - sessionState.lastActivity;
    const warningTime = SECURITY_CONFIG.session.timeoutWarningMinutes * 60 * 1000;
    const criticalTime = warningTime + (5 * 60 * 1000); // 5 minutes before expiry
    
    if (timeSinceActivity < warningTime) return 'healthy';
    if (timeSinceActivity < criticalTime) return 'warning';
    return 'critical';
  }, [sessionState.lastActivity]);

  // Log session metrics periodically
  useEffect(() => {
    if (!user) return;

    const logMetrics = () => {
      const sessionDuration = Date.now() - sessionStartRef.current;
      setSessionMetrics(prev => ({
        totalSessions: prev.totalSessions + 1,
        averageSessionDuration: (prev.averageSessionDuration + sessionDuration) / 2,
        suspiciousActivity: prev.suspiciousActivity
      }));
    };

    // Log metrics every 5 minutes
    const interval = setInterval(logMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    sessionState,
    sessionMetrics,
    extendSession,
    updateActivity,
    getSessionHealth
  };
};
