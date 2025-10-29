/**
 * Production-ready logging utility
 * Replaces console.debug and provides structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
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
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }
    
    if (error) {
      formatted += `\n${error.stack || error.message}`;
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
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
    // TODO: Integrate with Sentry or other logging service
    // For now, we'll just track in analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: entry.message,
        fatal: entry.level === 'error'
      });
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log('error', message, context, error);
  }
}

export const logger = new Logger();
