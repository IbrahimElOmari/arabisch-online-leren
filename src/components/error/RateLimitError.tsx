import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface RateLimitErrorProps {
  retryAfter: number | null;
  action?: string;
  onRetry?: () => void;
}

export const RateLimitError: React.FC<RateLimitErrorProps> = ({
  retryAfter,
  action,
  onRetry
}) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!retryAfter) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((retryAfter - Date.now()) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [retryAfter]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('security.rateLimit.title')}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          {action 
            ? t('security.rateLimit.messageAction', { action })
            : t('security.rateLimit.message')
          }
        </p>
        
        {timeRemaining > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3" />
            <span>{t('security.rateLimit.retryIn', { time: formatTime(timeRemaining) })}</span>
          </div>
        )}

        {timeRemaining === 0 && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            {t('security.rateLimit.tryAgain')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
