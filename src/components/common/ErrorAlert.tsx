
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  title: string;
  description: string;
  onRetry?: () => void;
  retryText?: string;
  isRetrying?: boolean;
}

/**
 * Standardized error alert component with optional retry functionality
 */
export const ErrorAlert = React.memo(({ 
  title, 
  description, 
  onRetry, 
  retryText = "Opnieuw proberen",
  isRetrying = false 
}: ErrorAlertProps) => {
  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center gap-3">
        {description}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Bezig...' : retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
});

ErrorAlert.displayName = 'ErrorAlert';
