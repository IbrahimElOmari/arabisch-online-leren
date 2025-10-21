import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({ size = 'md', className, text }: LoadingSpinnerProps) => {
  const { getFlexDirection, isRTL } = useRTLLayout();
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`${getFlexDirection('col')} items-center gap-2`}>
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        {text && (
          <span className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

export const FullPageLoader = ({ text }: { text?: string }) => {
  const { t } = useTranslation();
  const defaultText = text || t('status.loading');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text={defaultText} />
    </div>
  );
};