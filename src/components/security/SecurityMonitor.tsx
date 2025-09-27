import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
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
  const [isLogging, setIsLogging] = useState(false);
  
  // Refs to prevent spam and track state
  const lastLogTime = useRef(0);
  const logCooldown = 30000; // 30 seconds instead of 5
  const initialLoadRef = useRef(true);

  // Debounced logging function
  const debouncedLog = useCallback(async (action: string, details: Record<string, any>) => {
    const now = Date.now();
    if (now - lastLogTime.current < logCooldown || isLogging) {
      return;
    }

    setIsLogging(true);
    lastLogTime.current = now;

    try {
      await securityLogger.logSuspiciousActivity(action, details);
    } catch (error) {
      console.warn('Security logging failed (non-blocking):', error);
    } finally {
      setIsLogging(false);
    }
  }, [isLogging]);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!initialLoadRef.current) {
        debouncedLog('connection_restored', {
          offline_duration: Date.now() - (window as any).offlineTimestamp
        });
      }
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
  }, [debouncedLog]);

  // Log user sessions with enhanced null safety
  useEffect(() => {
    if (user && profile && !initialLoadRef.current) {
      // Safe logging with null checks
      const email = user.email || 'unknown';
      const role = profile.role || 'unknown';
      
      securityLogger.logAuthAttempt(true, email, {
        login_method: 'session_restored',
        role: role,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
        timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown'
      });
    }
    
    // Mark initial load as complete
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
    }
  }, [user, profile]);

  // Enhanced security monitoring with reduced frequency
  useEffect(() => {
    let pageChangeCount = 0;
    let keyboardPatternDetected = false;
    let mousePatternSuspicious = false;
    const startTime = Date.now();
    const keySequence: string[] = [];

    const handleNavigation = () => {
      pageChangeCount++;
      const timeSpent = Date.now() - startTime;
      
      // Increased threshold to reduce false positives
      if (pageChangeCount > 25 && timeSpent < 60000) {
        const threat: SecurityThreat = {
          id: Math.random().toString(36),
          type: 'rapid_navigation',
          severity: 'medium',
          message: 'Verdachte navigatie gedetecteerd',
          timestamp: Date.now()
        };
        
        setThreats(prev => [...prev, threat]);
        
        debouncedLog('rapid_navigation', {
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
      if (pattern.includes('aaaaaaaaaa') || pattern.includes('1111111111')) { // Increased threshold
        if (!keyboardPatternDetected) {
          keyboardPatternDetected = true;
          debouncedLog('keyboard_pattern', {
            pattern: pattern.substring(0, 50),
            sequence_length: keySequence.length
          });
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      // Detect perfectly straight mouse movements (bot behavior) with higher threshold
      const movement = Math.abs(event.movementX) + Math.abs(event.movementY);
      if (movement > 200 && (event.movementX === 0 || event.movementY === 0)) {
        if (!mousePatternSuspicious) {
          mousePatternSuspicious = true;
          debouncedLog('mouse_pattern', {
            movement_x: event.movementX,
            movement_y: event.movementY,
            client_x: event.clientX,
            client_y: event.clientY
          });
        }
      }
    };

    const handleContextMenu = (event: Event) => {
      debouncedLog('context_menu_access', {
        element: (event.target as Element)?.tagName || 'unknown',
        timestamp: Date.now()
      });
    };

    const handleDevTools = () => {
      debouncedLog('devtools_detected', {
        window_outer_width: window.outerWidth,
        window_inner_width: window.innerWidth,
        height_difference: window.outerHeight - window.innerHeight
      });
    };

    // Check for developer tools less frequently
    const devToolsCheck = setInterval(() => {
      if (typeof window !== 'undefined' && 
          (window.outerHeight - window.innerHeight > 200 || 
           window.outerWidth - window.innerWidth > 200)) {
        handleDevTools();
      }
    }, 30000); // Reduced frequency

    // Add passive listeners to improve performance
    window.addEventListener('popstate', handleNavigation, { passive: true });
    document.addEventListener('keydown', handleKeyDown, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('contextmenu', handleContextMenu, { passive: true });

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(devToolsCheck);
    };
  }, [debouncedLog]);

  const dismissThreat = (threatId: string) => {
    setThreats(prev => prev.filter(t => t.id !== threatId));
  };

  // Safe session health check with fallback
  const sessionHealth = sessionState ? getSessionHealth() : 'healthy';
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
      
      {/* Session timeout warning - with null safety */}
      {sessionState?.showWarning && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className="max-w-md border-destructive">
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Sessie verloopt over {Math.ceil((sessionState.timeUntilExpiry || 0) / 60000)} min
              </span>
              <Button size="sm" onClick={extendSession} className="ms-2">
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
                className="ms-2"
              >
                Sluiten
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ))}
      
      {/* Security status indicator - only in development */}
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
