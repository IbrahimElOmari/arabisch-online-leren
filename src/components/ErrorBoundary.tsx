import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Multilingual error messages
const errorMessages = {
  nl: {
    title: 'Er is iets misgegaan',
    description: 'We hebben een onverwachte fout ontdekt. Probeer de pagina te vernieuwen of ga terug naar de homepagina.',
    refresh: 'Pagina vernieuwen',
    home: 'Naar home',
    details: 'Technische details',
  },
  en: {
    title: 'Something went wrong',
    description: 'We encountered an unexpected error. Please try refreshing the page or go back to the home page.',
    refresh: 'Refresh page',
    home: 'Go home',
    details: 'Technical details',
  },
  ar: {
    title: 'حدث خطأ ما',
    description: 'واجهنا خطأ غير متوقع. يرجى محاولة تحديث الصفحة أو العودة إلى الصفحة الرئيسية.',
    refresh: 'تحديث الصفحة',
    home: 'الصفحة الرئيسية',
    details: 'التفاصيل التقنية',
  },
};

// Get current language from document or localStorage
const getCurrentLanguage = (): 'nl' | 'en' | 'ar' => {
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang;
    if (htmlLang === 'ar') return 'ar';
    if (htmlLang === 'en') return 'en';
  }
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('i18nextLng');
    if (stored === 'ar') return 'ar';
    if (stored === 'en') return 'en';
  }
  return 'nl';
};

// Check if RTL
const isRTL = (): boolean => {
  const lang = getCurrentLanguage();
  return lang === 'ar';
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // Log to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: errorInfo });
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const lang = getCurrentLanguage();
      const messages = errorMessages[lang];
      const rtl = isRTL();

      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4 bg-background"
          dir={rtl ? 'rtl' : 'ltr'}
        >
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">{messages.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                {messages.description}
              </p>
              
              <div className={`flex gap-3 justify-center ${rtl ? 'flex-row-reverse' : 'flex-row'}`}>
                <Button onClick={this.handleRefresh} variant="default">
                  <RefreshCw className={`h-4 w-4 ${rtl ? 'ms-2' : 'me-2'}`} />
                  {messages.refresh}
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className={`h-4 w-4 ${rtl ? 'ms-2' : 'me-2'}`} />
                  {messages.home}
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 p-4 bg-muted rounded-lg text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    {messages.details}
                  </summary>
                  <pre className="overflow-auto text-xs text-destructive whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;