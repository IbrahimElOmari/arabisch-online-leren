
import React, { Component, ReactNode } from 'react';
import { securityLogger } from '@/utils/securityLogger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class SecurityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log security-relevant errors
    securityLogger.logSuspiciousActivity('application_error', {
      error_message: error.message,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
      error_id: this.state.errorId,
      timestamp: new Date().toISOString()
    });

    // Check for potential security issues
    if (this.isPotentialSecurityIssue(error)) {
      securityLogger.logSuspiciousActivity('potential_security_issue', {
        error_type: error.name,
        error_message: error.message,
        error_id: this.state.errorId
      });
    }
  }

  private isPotentialSecurityIssue(error: Error): boolean {
    const securityPatterns = [
      /script/i,
      /eval/i,
      /document\.write/i,
      /innerHTML/i,
      /xss/i,
      /injection/i,
      /unauthorized/i
    ];

    return securityPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
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
                We hebben een onverwachte fout gedetecteerd. Het incident is gelogd voor analyse.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="text-xs">
                  <summary>Technische details (alleen zichtbaar in ontwikkeling)</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error?.message}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Pagina verversen
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="default"
                >
                  Naar startpagina
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Fout ID: {this.state.errorId}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
