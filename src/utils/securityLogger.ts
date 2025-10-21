
import { supabase } from '@/integrations/supabase/client';
import { SECURITY_CONFIG, SensitiveAction } from '@/config/security';

export type SecurityEventSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SecurityEvent {
  user_id?: string;
  action: string;
  severity: SecurityEventSeverity;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp?: string;
}

class SecurityLogger {
  private async log(event: SecurityEvent) {
    try {
      // Get user info if available - with null safety
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn('SecurityLogger: Auth check failed, logging anonymously:', authError.message);
      }
      
      const userId = event.user_id || authData?.user?.id;
      
      // Only log to database if we have a valid user or it's a system event
      if (!userId && event.severity !== 'critical') {
        console.log('SecurityLogger: Skipping non-critical event without user ID:', event.action);
        return;
      }

      const securityEvent = {
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        actie: event.action,
        severity: event.severity,
        details: {
          ...event.details,
          timestamp: new Date().toISOString(),
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        },
        created_at: new Date().toISOString()
      };

      // Log to audit table only if we have a user or it's critical
      if (userId || event.severity === 'critical') {
        const { error } = await supabase
          .from('audit_log')
          .insert([securityEvent]);

        if (error) {
          console.error('Failed to log security event to database:', error);
          // Don't throw, just log locally
        }
      }

      // Console log for development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Security Event:', securityEvent);
      }

      // Alert on critical events
      if (event.severity === 'critical' && SECURITY_CONFIG.monitoring.alertOnSuspiciousActivity) {
        this.alertCriticalEvent(securityEvent);
      }

    } catch (error) {
      console.error('Security logging failed (non-blocking):', error);
      // Don't re-throw to prevent breaking the application
    }
  }

  private async alertCriticalEvent(event: any) {
    try {
      // In a real application, this would send alerts to administrators
      console.error('🚨 CRITICAL SECURITY EVENT:', event);
      
      // Could integrate with external monitoring services
      // await this.sendToMonitoringService(event);
    } catch (error) {
      console.error('Critical event alerting failed:', error);
    }
  }

  // Public logging methods with enhanced null safety
  async logAuthAttempt(success: boolean, email?: string, details?: Record<string, any>) {
    await this.log({
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      severity: success ? 'info' : 'warning',
      details: {
        email: email || 'unknown',
        success,
        ...details
      }
    });
  }

  async logPrivilegeChange(targetUserId: string, oldRole: string, newRole: string) {
    if (!targetUserId) {
      console.warn('SecurityLogger: Skipping privilege change log - no target user ID');
      return;
    }
    
    await this.log({
      action: 'PRIVILEGE_CHANGE',
      severity: 'critical',
      details: {
        target_user_id: targetUserId,
        old_role: oldRole || 'unknown',
        new_role: newRole || 'unknown'
      }
    });
  }

  async logSensitiveAction(action: SensitiveAction, details: Record<string, any> = {}) {
    await this.log({
      action: action.toUpperCase(),
      severity: 'warning',
      details
    });
  }

  async logSuspiciousActivity(reason: string, details: Record<string, any> = {}) {
    await this.log({
      action: 'SUSPICIOUS_ACTIVITY',
      severity: 'error',
      details: {
        reason: reason || 'unknown',
        ...details
      }
    });
  }

  async logDataAccess(resource: string, operation: string, details: Record<string, any> = {}) {
    await this.log({
      action: 'DATA_ACCESS',
      severity: 'info',
      details: {
        resource: resource || 'unknown',
        operation: operation || 'unknown',
        ...details
      }
    });
  }
}

export const securityLogger = new SecurityLogger();
