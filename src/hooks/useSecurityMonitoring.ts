
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { securityLogger } from '@/utils/securityLogger';
import { useRateLimit } from './useRateLimit';

export const useSecurityMonitoring = () => {
  const { user, profile } = useAuth();
  const { checkRateLimit } = useRateLimit({ action: 'ADMIN_ACTION', identifier: user?.id });

  // Monitor sensitive operations
  const logSensitiveOperation = useCallback(async (action: string, details: any = {}) => {
    await securityLogger.logSensitiveAction(action as any, {
      user_id: user?.id,
      user_role: profile?.role,
      timestamp: new Date().toISOString(),
      ...details
    });
  }, [user, profile]);

  // Validate permissions for data access
  const validateDataAccess = useCallback(async (resource: string, operation: string) => {
    if (!profile) return false;

    // Rate limiting for sensitive operations
    const allowed = await checkRateLimit();
    if (!allowed) {
      await securityLogger.logSuspiciousActivity('rate_limit_exceeded', {
        resource,
        operation,
        user_role: profile.role
      });
      return false;
    }

    // Log data access
    await securityLogger.logDataAccess(resource, operation, {
      user_role: profile.role,
      user_id: user?.id
    });

    // Role-based access control
    switch (profile.role) {
      case 'admin':
        return true; // Admin can access everything
      case 'leerkracht':
        // Teachers can only access their own class data
        return ['tasks', 'questions', 'submissions', 'grades'].includes(resource);
      case 'leerling':
        // Students can only access their own data
        return ['own_submissions', 'own_grades', 'assigned_tasks'].includes(resource);
      default:
        return false;
    }
  }, [profile, user, checkRateLimit]);

  // Input validation and sanitization
  const validateInput = useCallback((input: string, type: 'text' | 'html' | 'file'): boolean => {
    if (!input) return false;

    switch (type) {
      case 'text':
        // Check for XSS patterns
        const xssPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
        return !xssPatterns.some(pattern => pattern.test(input));
      
      case 'html':
        // More strict HTML validation
        const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i, /<object/i];
        return !dangerousPatterns.some(pattern => pattern.test(input));
      
      case 'file':
        // File type validation
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'];
        return allowedExtensions.some(ext => input.toLowerCase().endsWith(ext));
      
      default:
        return false;
    }
  }, []);

  // Monitor for suspicious activity
  const detectSuspiciousActivity = useCallback(async (activity: {
    type: string;
    frequency?: number;
    timeWindow?: number;
    metadata?: any;
  }) => {
    const { type, frequency = 0, timeWindow = 60000, metadata = {} } = activity;

    // Detect rapid successive actions
    if (frequency > 10 && timeWindow < 60000) {
      await securityLogger.logSuspiciousActivity('rapid_actions', {
        activity_type: type,
        frequency,
        time_window: timeWindow,
        ...metadata
      });
      return true;
    }

    // Detect unusual access patterns
    if (type === 'data_access' && metadata.unusual_pattern) {
      await securityLogger.logSuspiciousActivity('unusual_access_pattern', metadata);
      return true;
    }

    return false;
  }, []);

  // Set up security event monitoring
  useEffect(() => {
    if (!user || !profile) return;

    // Monitor for security events
    const securityChannel = supabase
      .channel('security-monitoring')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'audit_log'
      }, (payload) => {
        console.log('Security event detected:', payload);
        // Could trigger additional security measures here
      })
      .subscribe();

    return () => {
      supabase.removeChannel(securityChannel);
    };
  }, [user, profile]);

  return {
    logSensitiveOperation,
    validateDataAccess,
    validateInput,
    detectSuspiciousActivity
  };
};
