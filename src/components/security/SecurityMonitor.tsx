
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { securityLogger } from '@/utils/securityLogger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Clock, AlertTriangle, Wifi } from 'lucide-react';

interface SecurityThreat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
}

export const SecurityMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { sessionState, extendSession, getSessionHealth } = useSessionSecurity();
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      securityLogger.logSuspiciousActivity('connection_restored', {
        offline_duration: Date.now() - (window as any).offlineTimestamp
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      (window as any).offlineTimestamp = Date.now();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Log user sessions with enhanced details
  useEffect(() => {
    if (user && profile) {
      securityLogger.logAuthAttempt(true, user.email, {
        login_method: 'session_restored',
        role: profile.role,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }, [user, profile]);

  // Enhanced security monitoring
  useEffect(() => {
    let pageChangeCount = 0;
    let keyboardPatternDetected = false;
    let mousePatternSuspicious = false;
    const startTime = Date.now();
    const keySequence: string[] = [];

    const handleNavigation = () => {
      pageChangeCount++;
      const timeSpent = Date.now() - startTime;
      
      if (pageChangeCount > 15 && timeSpent < 60000) {
        const threat: SecurityThreat = {
          id: Math.random().toString(36),
          type: 'rapid_navigation',
          severity: 'medium',
          message: 'Verdachte navigatie gedetecteerd',
          timestamp: Date.now()
        };
        
        setThreats(prev => [...prev, threat]);
        
        securityLogger.logSuspiciousActivity('rapid_navigation', {
          page_changes: pageChangeCount,
          time_spent: timeSpent,
          pages_per_minute: (pageChangeCount / timeSpent) * 60000
        });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      keySequence.push(event.key);
      if (keySequence.length > 20) keySequence.shift();
      
      // Detect potential automated typing patterns
      const pattern = keySequence.join('');
      if (pattern.includes('aaaaaaa') || pattern.includes('1111111')) {
        if (!keyboardPatternDetected) {
          keyboardPatternDetected = true;
          securityLogger.logSuspiciousActivity('keyboard_pattern', {
            pattern: pattern.substring(0, 50),
            sequence_length: keySequence.length
          });
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      // Detect perfectly straight mouse movements (bot behavior)
      const movement = Math.abs(event.movementX) + Math.abs(event.movementY);
      if (movement > 100 && (event.movementX === 0 || event.movementY === 0)) {
        if (!mousePatternSuspicious) {
          mousePatternSuspicious = true;
          securityLogger.logSuspiciousActivity('mouse_pattern', {
            movement_x: event.movementX,
            movement_y: event.movementY,
            client_x: event.clientX,
            client_y: event.clientY
          });
        }
      }
    };

    const handleContextMenu = (event: Event) => {
      securityLogger.logSuspiciousActivity('context_menu_access', {
        element: (event.target as Element)?.tagName,
        timestamp: Date.now()
      });
    };

    const handleDevTools = () => {
      securityLogger.logSuspiciousActivity('devtools_detected', {
        window_outer_width: window.outerWidth,
        window_inner_width: window.innerWidth,
        height_difference: window.outerHeight - window.innerHeight
      });
    };

    // Check for developer tools
    const devToolsCheck = setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200 || 
          window.outerWidth - window.innerWidth > 200) {
        handleDevTools();
      }
    }, 5000);

    window.addEventListener('popstate', handleNavigation);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(devToolsCheck);
    };
  }, []);

  const dismissThreat = (threatId: string) => {
    setThreats(prev => prev.filter(t => t.id !== threatId));
  };

  const sessionHealth = getSessionHealth();
  const sessionHealthColors = {
    healthy: 'text-green-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500'
  };

  return (
    <>
      {children}
      
      {/* Connection status */}
      {!isOnline && (
        <div className="fixed top-4 left-4 z-50">
          <Alert className="max-w-sm border-destructive">
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              Geen internetverbinding. Sommige functies werken mogelijk niet.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Session timeout warning */}
      {sessionState.showWarning && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className="max-w-md border-destructive">
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Sessie verloopt over {Math.ceil(sessionState.timeUntilExpiry / 60000)} min</span>
              <Button size="sm" onClick={extendSession} className="ml-2">
                Verlengen
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Security threats */}
      {threats.map(threat => (
        <div key={threat.id} className="fixed bottom-4 left-4 z-50">
          <Alert className="max-w-md border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{threat.message}</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => dismissThreat(threat.id)}
                className="ml-2"
              >
                Sluiten
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ))}
      
      {/* Security status indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 text-sm shadow-lg">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Security: Actief</span>
            <div className={`w-2 h-2 rounded-full ${sessionHealthColors[sessionHealth]}`} />
          </div>
        </div>
      )}
    </>
  );
};
