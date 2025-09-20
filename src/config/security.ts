
export const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-{NONCE}'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Will be improved with nonce
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://*.supabase.co"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
  
  // Security headers
  headers: {
    strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
    xContentTypeOptions: "nosniff",
    xFrameOptions: "DENY",
    xXSSProtection: "1; mode=block",
    referrerPolicy: "strict-origin-when-cross-origin",
  },
  
  // Session configuration (can be overridden by environment variables)
  session: {
    timeoutWarningMinutes: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES) - 5 || 25, // Warning 5 minutes before timeout
    maxIdleMinutes: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES) || 30, // Auto logout after timeout
    extendOnActivity: true,
  },
  
  // Rate limiting thresholds
  rateLimits: {
    login: { maxAttempts: 5, windowMinutes: 15 },
    registration: { maxAttempts: 3, windowMinutes: 60 },
    forum: { maxPosts: 10, windowMinutes: 5 },
    sensitive: { maxAttempts: 2, windowMinutes: 30 },
  },
  
  // Security monitoring
  monitoring: {
    logSensitiveActions: true,
    alertOnSuspiciousActivity: true,
    maxFailedLogins: 3,
    lockoutDurationMinutes: 15,
  }
};

export const SENSITIVE_ACTIONS = [
  'role_change',
  'admin_impersonate',
  'bulk_delete',
  'system_config_change',
  'user_privilege_change'
] as const;

export type SensitiveAction = typeof SENSITIVE_ACTIONS[number];
