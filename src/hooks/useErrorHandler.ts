import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorState {
  hasError: boolean;
  error?: Error | string;
  retryCount: number;
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  onError?: (error: Error | string) => void;
  showToast?: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { maxRetries = 3, onError, showToast = true } = options;
  const { toast } = useToast();
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    retryCount: 0
  });

  const handleError = useCallback((error: Error | string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    console.error('Error handled:', error);
    
    setErrorState(prev => ({
      hasError: true,
      error,
      retryCount: prev.retryCount + 1
    }));

    if (showToast) {
      toast({
        title: "Er is een fout opgetreden",
        description: errorMessage,
        variant: "destructive"
      });
    }

    if (onError) {
      onError(error);
    }
  }, [onError, showToast, toast]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      retryCount: 0
    });
  }, []);

  const retry = useCallback(() => {
    if (errorState.retryCount < maxRetries) {
      setErrorState(prev => ({
        ...prev,
        hasError: false
      }));
      return true;
    }
    return false;
  }, [errorState.retryCount, maxRetries]);

  const canRetry = errorState.retryCount < maxRetries;

  return {
    errorState,
    handleError,
    clearError,
    retry,
    canRetry
  };
};