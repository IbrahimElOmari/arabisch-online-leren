/**
 * DashboardErrorBoundary - Catches runtime errors in dashboard routes
 * Displays error details in DEV mode to help diagnose issues
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    if (import.meta.env.DEV) {
      console.group('🚨 Dashboard Error Boundary caught an error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.log('Current route:', window.location.pathname);
      console.log('Document dir:', document.documentElement.getAttribute('dir'));
      console.log('Document lang:', document.documentElement.getAttribute('lang'));
      console.groupEnd();
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <Card className="m-4 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Er is een fout opgetreden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Er is iets misgegaan bij het laden van deze pagina.
            </p>

            {isDev && this.state.error && (
              <div className="space-y-2">
                <details className="rounded-lg border bg-muted/50 p-4">
                  <summary className="cursor-pointer font-mono text-sm font-medium">
                    Error Details (DEV only)
                  </summary>
                  <div className="mt-4 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 overflow-auto rounded bg-background p-2 text-xs">
                        {this.state.error.message}
                      </pre>
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-background p-2 text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 max-h-40 overflow-auto rounded bg-background p-2 text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    <div>
                      <strong>Context:</strong>
                      <ul className="mt-1 list-inside list-disc text-sm">
                        <li>Route: {window.location.pathname}</li>
                        <li>Dir: {document.documentElement.getAttribute('dir')}</li>
                        <li>Lang: {document.documentElement.getAttribute('lang')}</li>
                      </ul>
                    </div>
                  </div>
                </details>
              </div>
            )}

            <Button onClick={this.handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Probeer opnieuw
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
