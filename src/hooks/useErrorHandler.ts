
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { securityLogger } from '@/utils/securityLogger';

interface ErrorState {
  hasError: boolean;
  error?: Error | string;
  retryCount: number;
  errorId?: string;
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  onError?: (error: Error | string, errorId: string) => void;
  showToast?: boolean;
  logToSecurity?: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { maxRetries = 3, onError, showToast = true, logToSecurity = true } = options;
  const { toast } = useToast();
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    retryCount: 0
  });

  const generateErrorId = () => Math.random().toString(36).substr(2, 9);

  const getErrorMessage = (error: Error | string): string => {
    if (typeof error === 'string') return error;
    
    const message = error?.message || 'Onbekende fout';
    
    // Friendly error messages for common errors
    if (message.includes('fetch') || message.includes('network')) {
      return 'Verbindingsprobleem. Controleer je internetverbinding.';
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return 'Je hebt geen toegang tot deze functie.';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'De opgevraagde informatie kon niet gevonden worden.';
    }
    if (message.includes('timeout')) {
      return 'De aanvraag duurde te lang. Probeer het opnieuw.';
    }
    if (message.includes('useAuth must be used within an AuthProvider')) {
      return 'Er is een probleem met de authenticatie. De pagina wordt ververst.';
    }
    
    return message || 'Er is een onbekende fout opgetreden.';
  };

  const retry = useCallback(() => {
    if (errorState.retryCount < maxRetries) {
      setErrorState(prev => ({
        ...prev,
        hasError: false
      }));
      return true;
    }
    
    if (showToast) {
      toast({
        title: "Maximaal aantal pogingen bereikt",
        description: "Neem contact op met de support als het probleem blijft bestaan.",
        variant: "destructive"
      });
    }
    
    return false;
  }, [errorState.retryCount, maxRetries, toast, showToast]);

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorId = generateErrorId();
    const errorMessage = getErrorMessage(error);
    
    console.error('🚨 Error handled:', error, 'Context:', context, 'ID:', errorId);
    
    setErrorState(prev => ({
      hasError: true,
      error,
      retryCount: prev.retryCount + 1,
      errorId
    }));

    // Special handling for auth context errors
    if (typeof error === 'string' && error.includes('useAuth must be used within an AuthProvider')) {
      if (import.meta.env.DEV) {
        console.log('Auth context error detected, reloading page...');
      }
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    if (showToast) {
      const toastConfig: any = {
        title: "Er ging iets mis",
        description: errorMessage,
        variant: "destructive"
      };

      if (errorState.retryCount < maxRetries) {
        toastConfig.action = {
          altText: "Probeer opnieuw",
          onClick: () => retry()
        };
      }

      toast(toastConfig);
    }

    if (logToSecurity) {
      // Safe logging with error handling
      try {
        securityLogger.logSuspiciousActivity('application_error', {
          error_message: typeof error === 'string' ? error : (error?.message || 'Unknown'),
          error_stack: typeof error === 'object' ? error?.stack : undefined,
          context: context || 'unknown',
          error_id: errorId,
          retry_count: errorState.retryCount,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        });
      } catch (logError) {
        console.warn('Failed to log error to security logger:', logError);
      }
    }

    if (onError) {
      try {
        onError(error, errorId);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
  }, [onError, showToast, logToSecurity, toast, errorState.retryCount, maxRetries, retry]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      retryCount: 0
    });
  }, []);

  const canRetry = errorState.retryCount < maxRetries;

  return {
    errorState,
    handleError,
    clearError,
    retry,
    canRetry
  };
};

export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler: ReturnType<typeof useErrorHandler>['handleError'],
  context?: string
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    }
  }) as T;
};
