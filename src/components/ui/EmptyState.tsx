import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) => {
  const { getFlexDirection, getTextAlign, isRTL } = useRTLLayout();
  const { t } = useTranslation();
  
  return (
    <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardContent className={`${getFlexDirection('col')} items-center justify-center py-12 ${getTextAlign('center')}`}>
        {Icon && (
          <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        )}
        <h3 className={`text-lg font-semibold mb-2 ${isRTL ? 'arabic-text' : ''}`}>
          {title}
        </h3>
        {description && (
          <p className={`text-muted-foreground mb-6 max-w-sm ${isRTL ? 'arabic-text' : ''}`}>
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick} className="animate-fade-in">
            <span className={isRTL ? 'arabic-text' : ''}>
              {action.label}
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};