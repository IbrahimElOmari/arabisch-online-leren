
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { SECURITY_CONFIG } from '@/config/security';

interface SessionState {
  isActive: boolean;
  timeUntilWarning: number;
  timeUntilExpiry: number;
  showWarning: boolean;
}

export const useSessionSecurity = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    timeUntilWarning: 0,
    timeUntilExpiry: 0,
    showWarning: false
  });

  const [lastActivity, setLastActivity] = useState(Date.now());

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setSessionState(prev => ({ ...prev, showWarning: false }));
  }, []);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [user, updateActivity]);

  // Session timeout management
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const warningTime = SECURITY_CONFIG.session.timeoutWarningMinutes * 60 * 1000;
      const expireTime = SECURITY_CONFIG.session.maxIdleMinutes * 60 * 1000;

      const timeUntilWarning = Math.max(0, warningTime - timeSinceActivity);
      const timeUntilExpiry = Math.max(0, expireTime - timeSinceActivity);

      setSessionState({
        isActive: timeSinceActivity < expireTime,
        timeUntilWarning,
        timeUntilExpiry,
        showWarning: timeSinceActivity >= warningTime && timeSinceActivity < expireTime
      });

      // Auto logout if session expired
      if (timeSinceActivity >= expireTime) {
        toast({
          title: "Sessie verlopen",
          description: "Je bent automatisch uitgelogd wegens inactiviteit",
          variant: "destructive"
        });
        signOut();
      }

      // Show warning
      if (timeSinceActivity >= warningTime && timeSinceActivity < expireTime) {
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        toast({
          title: "Sessie verloopt binnenkort",
          description: `Je sessie verloopt over ${minutesLeft} minuten. Klik ergens om te verlengen.`,
          variant: "destructive"
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, lastActivity, toast, signOut]);

  const extendSession = useCallback(() => {
    updateActivity();
    toast({
      title: "Sessie verlengd",
      description: "Je sessie is succesvol verlengd",
    });
  }, [updateActivity, toast]);

  return {
    sessionState,
    extendSession,
    updateActivity
  };
};
