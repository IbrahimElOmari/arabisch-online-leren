
import React, { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { securityLogger } from '@/utils/securityLogger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Clock } from 'lucide-react';

export const SecurityMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { sessionState, extendSession } = useSessionSecurity();

  // Log user sessions
  useEffect(() => {
    if (user && profile) {
      securityLogger.logAuthAttempt(true, user.email, {
        login_method: 'session_restored',
        role: profile.role
      });
    }
  }, [user, profile]);

  // Monitor for suspicious patterns
  useEffect(() => {
    // Monitor for rapid page changes (potential bot behavior)
    let pageChangeCount = 0;
    const startTime = Date.now();

    const handleNavigation = () => {
      pageChangeCount++;
      const timeSpent = Date.now() - startTime;
      
      // Flag if more than 10 page changes in 30 seconds
      if (pageChangeCount > 10 && timeSpent < 30000) {
        securityLogger.logSuspiciousActivity('rapid_navigation', {
          page_changes: pageChangeCount,
          time_spent: timeSpent
        });
      }
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  return (
    <>
      {children}
      
      {/* Session timeout warning */}
      {sessionState.showWarning && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className="max-w-md">
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Sessie verloopt over {Math.ceil(sessionState.timeUntilExpiry / 60000)} min</span>
              <Button size="sm" onClick={extendSession}>
                Verlengen
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Security status indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 text-sm">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Security: Active</span>
          </div>
        </div>
      )}
    </>
  );
};
