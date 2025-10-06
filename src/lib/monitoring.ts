/**
 * Conditional Monitoring & Observability
 * 
 * This module initializes error tracking (Sentry) only when:
 * 1. VITE_SENTRY_DSN is configured
 * 2. App is running in production mode
 * 
 * Privacy-first: No PII is collected, tracking is opt-in via env vars
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
}

let sentryInitialized = false;

/**
 * Initialize Sentry error tracking (conditional)
 */
export async function initMonitoring(): Promise<void> {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const appEnv = import.meta.env.VITE_APP_ENV || 'development';
  
  // Only initialize in production with valid DSN
  if (!sentryDsn || appEnv !== 'production' || sentryInitialized) {
    console.info('[Monitoring] Sentry disabled (no DSN or not production)');
    return;
  }
  
  try {
    // Dynamic import to avoid bundling Sentry in dev
    // @ts-expect-error - Sentry is optional dependency, only loaded in production
    const Sentry = await import('@sentry/react');
    
    const config: SentryConfig = {
      dsn: sentryDsn,
      environment: appEnv,
      tracesSampleRate: 0.1, // Sample 10% of transactions
    };
    
    Sentry.init({
      ...config,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,  // Privacy: mask all text
          blockAllMedia: true // Privacy: block all media
        }),
      ],
      // Privacy: filter out sensitive data
      beforeSend(event) {
        // Remove PII from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              delete breadcrumb.data.email;
              delete breadcrumb.data.password;
              delete breadcrumb.data.token;
            }
            return breadcrumb;
          });
        }
        
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.Cookie;
        }
        
        return event;
      }
    });
    
    sentryInitialized = true;
    console.info('[Monitoring] Sentry initialized');
  } catch (error) {
    console.error('[Monitoring] Failed to initialize Sentry:', error);
  }
}

/**
 * Check if monitoring is active
 */
export function isMonitoringEnabled(): boolean {
  return sentryInitialized;
}
