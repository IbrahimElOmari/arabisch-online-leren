
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { useRTLLayout } from '@/hooks/useRTLLayout';

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
  retryText,
  isRetrying = false 
}: ErrorAlertProps) => {
  const { t } = useTranslation();
  const { isRTL } = useRTLLayout();
  
  const defaultRetryText = retryText || t('common.retry', 'Opnieuw proberen');
  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className={isRTL ? 'arabic-text' : ''}>{title}</AlertTitle>
      <AlertDescription className={`flex items-center gap-3 ${isRTL ? 'arabic-text' : ''}`}>
        {description}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'} ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? t('status.loading') : defaultRetryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
});

ErrorAlert.displayName = 'ErrorAlert';
