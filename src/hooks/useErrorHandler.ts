
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
    
    // Friendly error messages for common errors
    if (error.message.includes('fetch')) return 'Verbindingsprobleem. Controleer je internetverbinding.';
    if (error.message.includes('unauthorized')) return 'Je hebt geen toegang tot deze functie.';
    if (error.message.includes('not found')) return 'De opgevraagde informatie kon niet gevonden worden.';
    if (error.message.includes('timeout')) return 'De aanvraag duurde te lang. Probeer het opnieuw.';
    
    return error.message || 'Er is een onbekende fout opgetreden.';
  };

  const retry = useCallback(() => {
    if (errorState.retryCount < maxRetries) {
      setErrorState(prev => ({
        ...prev,
        hasError: false
      }));
      return true;
    }
    
    toast({
      title: "Maximaal aantal pogingen bereikt",
      description: "Neem contact op met de support als het probleem blijft bestaan.",
      variant: "destructive"
    });
    
    return false;
  }, [errorState.retryCount, maxRetries, toast]);

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
      securityLogger.logSuspiciousActivity('application_error', {
        error_message: typeof error === 'string' ? error : error.message,
        error_stack: typeof error === 'object' ? error.stack : undefined,
        context,
        error_id: errorId,
        retry_count: errorState.retryCount
      });
    }

    if (onError) {
      onError(error, errorId);
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
