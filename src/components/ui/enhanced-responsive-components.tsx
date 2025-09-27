import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Enhanced Card that adapts to screen size
interface ResponsiveCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: React.ReactNode;
  compact?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
}

export const ResponsiveCard = ({
  children,
  title,
  subtitle,
  className,
  headerAction,
  compact = false,
  elevation = 'sm'
}: ResponsiveCardProps) => {
  const isMobile = useIsMobile();
  const { isRTL } = useRTLLayout();

  const elevationClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg hover:shadow-xl'
  };

  return (
    <Card className={cn(
      'transition-all duration-200',
      elevationClasses[elevation],
      isMobile && compact && 'border-0 shadow-none bg-transparent',
      className
    )}>
      {title && (
        <CardHeader className={cn(
          isMobile && compact ? 'px-0 pb-3' : 'pb-4',
          isRTL && 'text-right'
        )}>
          <div className={cn(
            'flex items-center justify-between',
            isMobile && 'flex-col items-start gap-2',
            isRTL && 'flex-row-reverse'
          )}>
            <div className="space-y-1">
              <CardTitle className={cn(
                isMobile ? 'text-lg' : 'text-xl',
                isRTL && 'arabic-text'
              )}>
                {title}
              </CardTitle>
              {subtitle && (
                <p className={cn(
                  'text-sm text-muted-foreground',
                  isRTL && 'arabic-text'
                )}>
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className={cn(
                isMobile && 'w-full flex justify-end'
              )}>
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(
        isMobile && compact && 'px-0'
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

// Responsive Stats Grid
interface StatItemProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export const StatItem = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon
}: StatItemProps) => {
  const { isRTL } = useRTLLayout();
  const isMobile = useIsMobile();

  const changeColors = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  };

  return (
    <div className={cn(
      'space-y-2',
      isMobile && 'text-center'
    )}>
      <div className={cn(
        'flex items-center gap-2',
        isMobile && 'justify-center',
        isRTL && 'flex-row-reverse'
      )}>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <span className={cn(
          'text-sm font-medium text-muted-foreground',
          isRTL && 'arabic-text'
        )}>
          {label}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className={cn(
          'text-2xl font-bold',
          isMobile && 'text-xl'
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {change && (
          <div className={cn(
            'text-sm',
            changeColors[changeType]
          )}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
};

export const ResponsiveStatsGrid = ({
  stats,
  className
}: {
  stats: StatItemProps[];
  className?: string;
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      'grid gap-4',
      isMobile 
        ? 'grid-cols-2' 
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      className
    )}>
      {stats.map((stat, index) => (
        <ResponsiveCard 
          key={index}
          compact={isMobile}
          elevation="sm"
          className="hover:shadow-md transition-shadow"
        >
          <StatItem {...stat} />
        </ResponsiveCard>
      ))}
    </div>
  );
};

// Responsive Button Group
interface ResponsiveButtonGroupProps {
  buttons: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    disabled?: boolean;
    icon?: React.ReactNode;
  }>;
  className?: string;
  orientation?: 'horizontal' | 'vertical' | 'auto';
}

export const ResponsiveButtonGroup = ({
  buttons,
  className,
  orientation = 'auto'
}: ResponsiveButtonGroupProps) => {
  const isMobile = useIsMobile();
  const { isRTL } = useRTLLayout();

  const getOrientation = () => {
    if (orientation === 'auto') {
      return isMobile && buttons.length > 2 ? 'vertical' : 'horizontal';
    }
    return orientation;
  };

  const actualOrientation = getOrientation();

  return (
    <div className={cn(
      'flex gap-2',
      actualOrientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
      isRTL && 'flex-row-reverse',
      className
    )}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant || 'outline'}
          onClick={button.onClick}
          disabled={button.disabled}
          size={isMobile ? 'sm' : 'default'}
          className={cn(
            actualOrientation === 'vertical' && 'w-full',
            isMobile && 'text-sm'
          )}
        >
          {button.icon && (
            <span className={cn(
              'shrink-0',
              isRTL ? 'ms-2' : 'me-2'
            )}>
              {button.icon}
            </span>
          )}
          {button.label}
        </Button>
      ))}
    </div>
  );
};

// Responsive List Component
interface ResponsiveListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive';
  };
  onClick?: () => void;
}

export const ResponsiveList = ({
  items,
  className,
  emptyMessage = 'Geen items gevonden'
}: {
  items: ResponsiveListItem[];
  className?: string;
  emptyMessage?: string;
}) => {
  const isMobile = useIsMobile();
  const { isRTL } = useRTLLayout();

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border bg-card',
            'hover:bg-accent hover:text-accent-foreground transition-colors',
            item.onClick && 'cursor-pointer',
            isMobile && 'flex-col items-start gap-2',
            isRTL && 'flex-row-reverse'
          )}
          onClick={item.onClick}
        >
          {item.icon && (
            <div className={cn(
              'flex-shrink-0',
              isMobile && 'self-start'
            )}>
              {item.icon}
            </div>
          )}
          
          <div className={cn(
            'flex-1 min-w-0',
            isMobile && 'w-full'
          )}>
            <div className={cn(
              'flex items-center gap-2 mb-1',
              isMobile && 'flex-wrap',
              isRTL && 'flex-row-reverse'
            )}>
              <h4 className={cn(
                'font-medium truncate',
                isMobile && 'text-sm',
                isRTL && 'arabic-text'
              )}>
                {item.title}
              </h4>
              
              {item.badge && (
                <Badge 
                  variant={item.badge.variant}
                  className="text-xs"
                >
                  {item.badge.text}
                </Badge>
              )}
            </div>
            
            {item.subtitle && (
              <p className={cn(
                'text-sm text-muted-foreground truncate',
                isRTL && 'arabic-text'
              )}>
                {item.subtitle}
              </p>
            )}
            
            {item.description && (
              <p className={cn(
                'text-xs text-muted-foreground mt-1',
                isMobile ? 'line-clamp-2' : 'truncate',
                isRTL && 'arabic-text'
              )}>
                {item.description}
              </p>
            )}
          </div>
          
          {item.action && (
            <div className={cn(
              'flex-shrink-0',
              isMobile && 'self-end w-full flex justify-end'
            )}>
              {item.action}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Responsive Tab Navigation
export const ResponsiveTabNav = ({
  tabs,
  activeTab,
  onTabChange,
  className
}: {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) => {
  const isMobile = useIsMobile();
  const { isRTL } = useRTLLayout();

  return (
    <div className={cn(
      'flex gap-1',
      isMobile ? 'overflow-x-auto pb-2' : 'flex-wrap',
      isRTL && 'flex-row-reverse',
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            isMobile && 'min-w-max text-xs px-2 py-1'
          )}
        >
          {tab.icon}
          <span className={isRTL ? 'arabic-text' : ''}>
            {tab.label}
          </span>
          {tab.badge && tab.badge > 0 && (
            <Badge 
              variant={activeTab === tab.id ? 'secondary' : 'default'}
              className="text-xs min-w-5 h-5 flex items-center justify-center p-0"
            >
              {tab.badge > 99 ? '99+' : tab.badge}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
};

export default {
  ResponsiveCard,
  StatItem,
  ResponsiveStatsGrid,
  ResponsiveButtonGroup,
  ResponsiveList,
  ResponsiveTabNav
};