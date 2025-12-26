/**
 * Enhanced Monitoring & Observability
 * 
 * Comprehensive error tracking and performance monitoring with Sentry
 * Privacy-first: No PII collected, full control via environment variables
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

let sentryInitialized = false;

/**
 * Initialize Sentry error tracking (production only)
 */
export async function initMonitoring(): Promise<void> {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const appEnv = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;
  
  // Only initialize in production with valid DSN
  if (!sentryDsn || appEnv === 'development' || sentryInitialized) {
    if (import.meta.env.DEV) {
      console.info('[Monitoring] Sentry disabled (no DSN, development mode, or already initialized)');
    }
    return;
  }
  
  try {
    // Dynamic import to avoid bundling Sentry in dev
    const Sentry = await import('@sentry/react');
    
    const config: SentryConfig = {
      dsn: sentryDsn,
      environment: appEnv,
      tracesSampleRate: 0.1, // Sample 10% of transactions
      replaysSessionSampleRate: 0.1, // Sample 10% of sessions for replay
      replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    };
    
    Sentry.init({
      ...config,
      integrations: [
        Sentry.browserTracingIntegration({
          // Trace navigation and resource loading
          traceFetch: true,
          traceXHR: true,
        }),
        Sentry.replayIntegration({
          maskAllText: true,  // Privacy: mask all text content
          blockAllMedia: true, // Privacy: block all media (images, video, audio)
          maskAllInputs: true, // Privacy: mask all form inputs
        }),
      ],
      
      // Filter out non-critical errors
      beforeSend(event, hint) {
        const error = hint.originalException;
        
        // Ignore ResizeObserver errors (benign browser quirk)
        if (error && error.toString().includes('ResizeObserver')) {
          return null;
        }
        
        // Ignore network errors from cancelled requests
        if (error && error.toString().includes('cancelled')) {
          return null;
        }
        
        // Remove PII from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              // Remove sensitive fields
              delete breadcrumb.data.email;
              delete breadcrumb.data.password;
              delete breadcrumb.data.token;
              delete breadcrumb.data.full_name;
              delete breadcrumb.data.phone;
            }
            return breadcrumb;
          });
        }
        
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.Cookie;
          delete event.request.headers['X-API-Key'];
        }
        
        // Remove PII from extra data
        if (event.extra) {
          delete event.extra.email;
          delete event.extra.password;
          delete event.extra.token;
        }
        
        return event;
      },
      
      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        // Random plugins/extensions
        'http://tt.epicplay.com',
        "Can't find variable: ZiteReader",
        'jigsaw is not defined',
        'ComboSearch is not defined',
        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // React HMR
        '__webpack_hmr',
      ],
      
      // Trace propagation (for distributed tracing)
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/xugosdedyukizseveahx\.supabase\.co\/rest/,
      ],
    });
    
    sentryInitialized = true;
    if (import.meta.env.DEV) {
      console.info('[Monitoring] Sentry initialized successfully', {
        environment: appEnv,
        tracesSampleRate: config.tracesSampleRate,
      });
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Monitoring] Failed to initialize Sentry:', error);
    }
  }
}

/**
 * Check if monitoring is active
 */
export function isMonitoringEnabled(): boolean {
  return sentryInitialized;
}

/**
 * Manually capture an exception
 */
export async function captureException(error: Error, context?: Record<string, unknown>): Promise<void> {
  if (!sentryInitialized) {
    if (import.meta.env.DEV) {
      console.error('[Monitoring] Exception captured (Sentry not initialized):', error, context);
    }
    return;
  }
  
  try {
    const Sentry = await import('@sentry/react');
    Sentry.captureException(error, {
      extra: context,
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Monitoring] Failed to capture exception:', err);
    }
  }
}

/**
 * Manually capture a message
 */
export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
  if (!sentryInitialized) {
    if (import.meta.env.DEV) {
      console.log(`[Monitoring] Message captured (Sentry not initialized) [${level}]:`, message);
    }
    return;
  }
  
  try {
    const Sentry = await import('@sentry/react');
    Sentry.captureMessage(message, level);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Monitoring] Failed to capture message:', err);
    }
  }
}

/**
 * Set user context for error tracking
 */
export async function setUser(user: { id: string; email?: string; role?: string } | null): Promise<void> {
  if (!sentryInitialized) {
    return;
  }
  
  try {
    const Sentry = await import('@sentry/react');
    
    if (user) {
      Sentry.setUser({
        id: user.id,
        // Don't include email for privacy (optional)
        // email: user.email,
        role: user.role,
      });
    } else {
      Sentry.setUser(null);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Monitoring] Failed to set user context:', err);
    }
  }
}

/**
 * Add breadcrumb for debugging
 */
export async function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!sentryInitialized) {
    return;
  }
  
  try {
    const Sentry = await import('@sentry/react');
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Monitoring] Failed to add breadcrumb:', err);
    }
  }
}

/**
 * Start a performance transaction
 */
export async function startTransaction(name: string, op: string) {
  if (!sentryInitialized) {
    return null;
  }
  
  try {
    // Transaction tracking not available in current Sentry version
    if (import.meta.env.DEV) {
      console.debug('[Monitoring] Transaction tracking:', name, op);
    }
    return null;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Monitoring] Failed to start transaction:', err);
    }
    return null;
  }
}
