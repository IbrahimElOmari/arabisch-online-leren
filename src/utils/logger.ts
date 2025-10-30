/**
 * Production-ready logging utility
 * Replaces console.debug and provides structured logging with PII redaction
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

// PII patterns to redact
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g,
  token: /(Bearer\s+)?[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
};

/**
 * Redacts PII from strings and objects
 */
function redactPII(value: unknown): unknown {
  if (typeof value === 'string') {
    let redacted = value;
    redacted = redacted.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
    redacted = redacted.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
    redacted = redacted.replace(PII_PATTERNS.token, '[TOKEN_REDACTED]');
    redacted = redacted.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]');
    return redacted;
  }
  
  if (Array.isArray(value)) {
    return value.map(redactPII);
  }
  
  if (value && typeof value === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Redact sensitive field names
      if (['password', 'token', 'secret', 'apiKey', 'api_key'].includes(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactPII(val);
      }
    }
    return redacted;
  }
  
  return value;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private minLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    
    // Redact PII from message and context
    const redactedMessage = redactPII(message) as string;
    const redactedContext = context ? redactPII(context) as Record<string, unknown> : undefined;
    
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${redactedMessage}`;
    
    if (redactedContext && Object.keys(redactedContext).length > 0) {
      formatted += ` ${JSON.stringify(redactedContext)}`;
    }
    
    if (error) {
      formatted += `\n${error.stack || error.message}`;
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    };

    const formatted = this.formatEntry(entry);

    // In production, send to external logging service (e.g., Sentry)
    if (!this.isDevelopment && level === 'error') {
      this.sendToExternalService(entry);
    }

    // Console output
    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.log(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // Sentry integration for production errors
    if (typeof window !== 'undefined') {
      // Check if Sentry is available
      const Sentry = (window as unknown as { Sentry?: { captureException: (error: Error, context?: unknown) => void } }).Sentry;
      
      if (Sentry && entry.error) {
        Sentry.captureException(entry.error, {
          level: entry.level,
          tags: {
            logLevel: entry.level
          },
          extra: redactPII(entry.context) as Record<string, unknown>
        });
      }
      
      // Fallback to gtag for analytics
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag('event', 'exception', {
          description: redactPII(entry.message),
          fatal: entry.level === 'error'
        });
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('error', message, context, error);
  }
}

export const logger = new Logger();
