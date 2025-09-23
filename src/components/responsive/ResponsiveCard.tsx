import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface ResponsiveCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  variant?: 'default' | 'compact' | 'fluid';
}

export const ResponsiveCard = ({ 
  title, 
  children, 
  className, 
  headerAction,
  variant = 'default' 
}: ResponsiveCardProps) => {
  const { isRTL } = useRTLLayout();

  const cardClasses = cn(
    '@container', // Enable container queries
    'w-full',
    {
      'min-h-[120px]': variant === 'compact',
      'min-h-[200px]': variant === 'default',
      'h-full': variant === 'fluid',
    },
    className
  );

  const contentClasses = cn(
    'space-y-4',
    {
      '@sm:space-y-2': variant === 'compact',
      '@md:space-y-6': variant === 'default',
    }
  );

  const headerClasses = cn(
    'flex items-center',
    {
      'justify-between': headerAction,
      'justify-start': !headerAction,
    },
    isRTL ? 'flex-row-reverse' : 'flex-row'
  );

  return (
    <Card className={cardClasses}>
      {title && (
        <CardHeader className="pb-3">
          <div className={headerClasses}>
            <CardTitle className={cn(
              'text-lg @md:text-xl font-semibold',
              isRTL ? 'arabic-text text-right' : 'text-left'
            )}>
              {title}
            </CardTitle>
            {headerAction && (
              <div className={cn(isRTL ? 'mr-auto' : 'ml-auto')}>
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={contentClasses}>
        {children}
      </CardContent>
    </Card>
  );
};