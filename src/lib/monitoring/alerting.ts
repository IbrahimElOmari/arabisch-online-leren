/**
 * Monitoring & Alerting Integration
 * 
 * Integrates with Sentry for error tracking and provides
 * custom alerting for performance thresholds and security events.
 */

import * as Sentry from '@sentry/react';

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

// Alert configuration
export interface AlertConfig {
  enabled: boolean;
  sentryDsn?: string;
  slackWebhook?: string;
  emailRecipients?: string[];
  thresholds: {
    errorRatePercent: number;
    responseTimeMs: number;
    cpuPercent: number;
    memoryPercent: number;
  };
}

// Default thresholds
const DEFAULT_THRESHOLDS = {
  errorRatePercent: 5,
  responseTimeMs: 3000,
  cpuPercent: 80,
  memoryPercent: 85,
};

// Alert payload
export interface AlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Alerting service class
class AlertingService {
  private config: AlertConfig;

  constructor() {
    this.config = {
      enabled: import.meta.env.PROD,
      thresholds: DEFAULT_THRESHOLDS,
    };
  }

  /**
   * Initialize alerting with configuration
   */
  init(config: Partial<AlertConfig>) {
    this.config = { ...this.config, ...config };
    
    if (this.config.sentryDsn && import.meta.env.PROD) {
      Sentry.init({
        dsn: this.config.sentryDsn,
        environment: import.meta.env.MODE,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    }
  }

  /**
   * Send an alert
   */
  async sendAlert(payload: AlertPayload): Promise<void> {
    if (!this.config.enabled) {
      if (import.meta.env.DEV) {
        console.log('[Alerting] Alert (dev mode):', payload);
      }
      return;
    }

    // Log to Sentry
    if (this.config.sentryDsn) {
      const sentryLevel = this.mapSeverityToSentry(payload.severity);
      Sentry.captureMessage(payload.message, {
        level: sentryLevel,
        tags: { severity: payload.severity },
        extra: payload.metadata,
      });
    }

    // Send to Slack if configured
    if (this.config.slackWebhook) {
      await this.sendSlackAlert(payload);
    }
  }

  /**
   * Check performance thresholds and alert if exceeded
   */
  checkThresholds(metrics: {
    errorRate?: number;
    responseTime?: number;
    cpu?: number;
    memory?: number;
  }): void {
    const { thresholds } = this.config;

    if (metrics.errorRate !== undefined && metrics.errorRate > thresholds.errorRatePercent) {
      this.sendAlert({
        title: 'High Error Rate',
        message: `Error rate ${metrics.errorRate.toFixed(2)}% exceeds threshold ${thresholds.errorRatePercent}%`,
        severity: metrics.errorRate > thresholds.errorRatePercent * 2 ? 'critical' : 'warning',
        timestamp: new Date().toISOString(),
        metadata: { errorRate: metrics.errorRate, threshold: thresholds.errorRatePercent },
      });
    }

    if (metrics.responseTime !== undefined && metrics.responseTime > thresholds.responseTimeMs) {
      this.sendAlert({
        title: 'Slow Response Time',
        message: `Response time ${metrics.responseTime}ms exceeds threshold ${thresholds.responseTimeMs}ms`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
        metadata: { responseTime: metrics.responseTime, threshold: thresholds.responseTimeMs },
      });
    }

    if (metrics.cpu !== undefined && metrics.cpu > thresholds.cpuPercent) {
      this.sendAlert({
        title: 'High CPU Usage',
        message: `CPU usage ${metrics.cpu}% exceeds threshold ${thresholds.cpuPercent}%`,
        severity: metrics.cpu > 95 ? 'critical' : 'warning',
        timestamp: new Date().toISOString(),
        metadata: { cpu: metrics.cpu, threshold: thresholds.cpuPercent },
      });
    }

    if (metrics.memory !== undefined && metrics.memory > thresholds.memoryPercent) {
      this.sendAlert({
        title: 'High Memory Usage',
        message: `Memory usage ${metrics.memory}% exceeds threshold ${thresholds.memoryPercent}%`,
        severity: metrics.memory > 95 ? 'critical' : 'warning',
        timestamp: new Date().toISOString(),
        metadata: { memory: metrics.memory, threshold: thresholds.memoryPercent },
      });
    }
  }

  /**
   * Report security event
   */
  reportSecurityEvent(event: {
    type: string;
    description: string;
    userId?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }): void {
    this.sendAlert({
      title: `Security Event: ${event.type}`,
      message: event.description,
      severity: 'critical',
      timestamp: new Date().toISOString(),
      metadata: {
        ...event.metadata,
        userId: event.userId,
        ipAddress: event.ipAddress,
      },
    });
  }

  /**
   * Report edge function error
   */
  reportEdgeFunctionError(functionName: string, error: Error, context?: Record<string, unknown>): void {
    this.sendAlert({
      title: `Edge Function Error: ${functionName}`,
      message: error.message,
      severity: 'error',
      timestamp: new Date().toISOString(),
      metadata: {
        functionName,
        errorStack: error.stack,
        ...context,
      },
    });
  }

  /**
   * Report database connection issue
   */
  reportDatabaseIssue(issue: string, context?: Record<string, unknown>): void {
    this.sendAlert({
      title: 'Database Connection Issue',
      message: issue,
      severity: 'critical',
      timestamp: new Date().toISOString(),
      metadata: context,
    });
  }

  private mapSeverityToSentry(severity: AlertSeverity): Sentry.SeverityLevel {
    const mapping: Record<AlertSeverity, Sentry.SeverityLevel> = {
      info: 'info',
      warning: 'warning',
      error: 'error',
      critical: 'fatal',
    };
    return mapping[severity];
  }

  private async sendSlackAlert(payload: AlertPayload): Promise<void> {
    if (!this.config.slackWebhook) return;

    const color = {
      info: '#36a64f',
      warning: '#ffcc00',
      error: '#ff6600',
      critical: '#ff0000',
    }[payload.severity];

    try {
      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color,
            title: payload.title,
            text: payload.message,
            ts: Math.floor(new Date(payload.timestamp).getTime() / 1000),
            fields: payload.metadata ? Object.entries(payload.metadata).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true,
            })) : [],
          }],
        }),
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to send Slack alert:', error);
      }
    }
  }
}

// Singleton instance
export const alerting = new AlertingService();

// Helper functions
export const initAlerting = (config: Partial<AlertConfig>) => alerting.init(config);
export const sendAlert = (payload: AlertPayload) => alerting.sendAlert(payload);
export const checkThresholds = (metrics: Parameters<AlertingService['checkThresholds']>[0]) => 
  alerting.checkThresholds(metrics);
export const reportSecurityEvent = (event: Parameters<AlertingService['reportSecurityEvent']>[0]) => 
  alerting.reportSecurityEvent(event);
export const reportEdgeFunctionError = (
  functionName: string, 
  error: Error, 
  context?: Record<string, unknown>
) => alerting.reportEdgeFunctionError(functionName, error, context);
export const reportDatabaseIssue = (issue: string, context?: Record<string, unknown>) => 
  alerting.reportDatabaseIssue(issue, context);
