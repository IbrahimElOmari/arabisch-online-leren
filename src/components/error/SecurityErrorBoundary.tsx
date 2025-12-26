
import React, { Component, ReactNode } from 'react';
import { securityLogger } from '@/utils/securityLogger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryCount: number;
  isRetrying: boolean;
}

export class SecurityErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Safely log security-relevant errors
    const errorDetails = {
      error_message: error?.message || 'Unknown error',
      error_stack: error?.stack || 'No stack trace',
      component_stack: errorInfo?.componentStack || 'No component stack',
      error_id: this.state.errorId || 'unknown',
      timestamp: new Date().toISOString(),
      retry_count: this.state.retryCount
    };

    // Log with error handling to prevent infinite loops
    try {
      securityLogger.logSuspiciousActivity('application_error', errorDetails);

      // Check for potential security issues
      if (this.isPotentialSecurityIssue(error)) {
        securityLogger.logSuspiciousActivity('potential_security_issue', {
          error_type: error?.name || 'Unknown',
          error_message: error?.message || 'Unknown error',
          error_id: this.state.errorId || 'unknown'
        });
      }
    } catch (logError) {
      if (import.meta.env.DEV) {
        console.error('Failed to log security error (preventing infinite loop):', logError);
      }
    }

    // Auto-retry for recoverable errors
    if (this.isRecoverableError(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  private isPotentialSecurityIssue(error: Error): boolean {
    if (!error?.message) return false;

    const securityPatterns = [
      /script/i,
      /eval/i,
      /document\.write/i,
      /innerHTML/i,
      /xss/i,
      /injection/i,
      /unauthorized/i,
      /access.*denied/i
    ];

    const errorMessage = error.message || '';
    const errorStack = error.stack || '';

    return securityPatterns.some(pattern => 
      pattern.test(errorMessage) || pattern.test(errorStack)
    );
  }

  private isRecoverableError(error: Error): boolean {
    if (!error?.message) return false;

    const recoverablePatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /connection/i,
      /temporary/i
    ];

    return recoverablePatterns.some(pattern => 
      pattern.test(error.message || '')
    );
  }

  private scheduleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.setState({ isRetrying: true });

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.state.retryCount) * 1000;

    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    }, delay);
  };

  private handleManualRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    } else {
      // Force reload if max retries exceeded
      window.location.reload();
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.state.isRetrying) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardContent className="flex items-center justify-center p-8">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  <span>Poging tot herstel...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Er is een fout opgetreden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We hebben een onverwachte fout gedetecteerd. {
                  this.state.retryCount < this.maxRetries 
                    ? 'Het systeem probeert automatisch te herstellen.' 
                    : 'Vernieuw de pagina om door te gaan.'
                }
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs">
                  <summary>Technische details (alleen zichtbaar in ontwikkeling)</summary>
                  <pre className="mt-2 whitespace-pre-wrap bg-muted p-2 rounded">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                {this.state.retryCount < this.maxRetries ? (
                  <Button onClick={this.handleManualRetry} variant="outline">
                    <RefreshCw className="h-4 w-4 me-2" />
                    Probeer opnieuw ({this.maxRetries - this.state.retryCount} pogingen over)
                  </Button>
                ) : (
                  <Button onClick={() => window.location.reload()} variant="outline">
                    <RefreshCw className="h-4 w-4 me-2" />
                    Pagina verversen
                  </Button>
                )}
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="default"
                >
                  Naar startpagina
                </Button>
              </div>
              
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground">
                  Fout ID: {this.state.errorId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
