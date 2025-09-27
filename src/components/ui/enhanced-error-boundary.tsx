import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  className?: string;
}

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Enhanced Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }

    // In production, you might want to send error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error monitoring service
      // errorMonitoringService.captureException(error, { extra: errorInfo });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorReport = {
      errorId,
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy error report to clipboard
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2));
    
    // You could also open a modal with error reporting form
    alert('Error details copied to clipboard. Please contact support with this information.');
  };

  public render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const isProductionError = process.env.NODE_ENV === 'production';

      return (
        <div className={cn('min-h-screen flex items-center justify-center bg-background p-6', this.props.className)}>
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Er is iets misgegaan
              </CardTitle>
              <CardDescription className="text-base">
                {isProductionError 
                  ? 'We hebben een onverwachte fout ondervonden. Ons team is op de hoogte gesteld.'
                  : 'Er is een fout opgetreden tijdens het laden van deze pagina.'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error ID for reference */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Fout Referentie</AlertTitle>
                <AlertDescription className="font-mono text-sm">
                  ID: {errorId}
                </AlertDescription>
              </Alert>

              {/* Error Details (only in development or when showDetails is true) */}
              {(!isProductionError || this.props.showDetails) && error && (
                <Alert variant="destructive">
                  <AlertTitle>Technische Details</AlertTitle>
                  <AlertDescription className="mt-2">
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium hover:text-destructive-foreground">
                        Klik voor foutdetails
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <strong>Foutmelding:</strong>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {error.message}
                          </pre>
                        </div>
                        {error.stack && (
                          <div>
                            <strong>Stack Trace:</strong>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        {errorInfo?.componentStack && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              {/* User-friendly suggestions */}
              <Alert>
                <AlertTitle>Wat kunt u doen?</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                    <li>Probeer de pagina te verversen</li>
                    <li>Ga terug naar de hoofdpagina</li>
                    <li>Controleer uw internetverbinding</li>
                    <li>Wacht een paar minuten en probeer het opnieuw</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 sm:flex-none"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 me-2" />
                  Opnieuw Proberen
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="flex-1 sm:flex-none"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 me-2" />
                  Pagina Verversen
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1 sm:flex-none"
                  variant="outline"
                >
                  <Home className="h-4 w-4 me-2" />
                  Naar Dashboard
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex justify-center pt-2 border-t">
                <Button 
                  onClick={this.handleReportError}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <MessageCircle className="h-4 w-4 me-2" />
                  Rapporteer Fout
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

export default EnhancedErrorBoundary;