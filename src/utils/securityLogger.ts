
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
      // Get user info if available
      const { data: { user } } = await supabase.auth.getUser();
      
      const securityEvent = {
        user_id: event.user_id || user?.id,
        actie: event.action,
        severity: event.severity,
        details: {
          ...event.details,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
        created_at: new Date().toISOString()
      };

      // Log to audit table
      const { error } = await supabase
        .from('audit_log')
        .insert([securityEvent]);

      if (error) {
        console.error('Failed to log security event:', error);
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
      console.error('Security logging failed:', error);
    }
  }

  private async alertCriticalEvent(event: any) {
    // In a real application, this would send alerts to administrators
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
    
    // Could integrate with external monitoring services
    // await this.sendToMonitoringService(event);
  }

  // Public logging methods
  async logAuthAttempt(success: boolean, email?: string, details?: Record<string, any>) {
    await this.log({
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      severity: success ? 'info' : 'warning',
      details: {
        email,
        success,
        ...details
      }
    });
  }

  async logPrivilegeChange(targetUserId: string, oldRole: string, newRole: string) {
    await this.log({
      action: 'PRIVILEGE_CHANGE',
      severity: 'critical',
      details: {
        target_user_id: targetUserId,
        old_role: oldRole,
        new_role: newRole
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
        reason,
        ...details
      }
    });
  }

  async logDataAccess(resource: string, operation: string, details: Record<string, any> = {}) {
    await this.log({
      action: 'DATA_ACCESS',
      severity: 'info',
      details: {
        resource,
        operation,
        ...details
      }
    });
  }
}

export const securityLogger = new SecurityLogger();
