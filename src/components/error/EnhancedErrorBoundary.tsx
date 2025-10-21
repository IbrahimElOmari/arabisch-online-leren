import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, RefreshCw, Bug, Home, MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Math.random().toString(36).substring(2, 15);
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Er is iets misgegaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Er is een onverwachte fout opgetreden. Onze excuses voor het ongemak.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Error ID: {this.state.errorId}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {new Date().toLocaleString('nl-NL')}
                  </Badge>
                </div>
              </div>

              {/* Error Details for Development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium text-sm flex items-center gap-2 mb-2">
                    <Bug className="h-4 w-4" />
                    Technische details (alleen in ontwikkelingsmodus)
                  </summary>
                  <div className="space-y-3 text-xs">
                    <div>
                      <h4 className="font-medium mb-1">Error Message:</h4>
                      <code className="bg-destructive/10 text-destructive p-2 rounded block">
                        {this.state.error.message}
                      </code>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <h4 className="font-medium mb-1">Stack Trace:</h4>
                        <pre className="bg-muted-foreground/10 p-2 rounded text-xs overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <h4 className="font-medium mb-1">Component Stack:</h4>
                        <pre className="bg-muted-foreground/10 p-2 rounded text-xs overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {this.retryCount < this.maxRetries && (
                  <Button onClick={this.handleRetry} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Probeer opnieuw ({this.maxRetries - this.retryCount} pogingen over)
                  </Button>
                )}
                
                <Button variant="outline" onClick={this.handleReload} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Vernieuw pagina
                </Button>
                
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Ga naar homepage
                </Button>
              </div>

              {/* Support Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4" />
                  Hulp nodig?
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Als dit probleem aanhoudt, neem dan contact op met onze ondersteuning. 
                  Deel de Error ID hierboven om sneller geholpen te worden.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Contact Ondersteuning
                  </Button>
                  <Button variant="outline" size="sm">
                    Rapporteer Bug
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
