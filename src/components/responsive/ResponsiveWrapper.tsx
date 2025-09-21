import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveWrapper = ({
  children,
  className,
  mobileClassName,
  desktopClassName,
  breakpoint = 'md'
}: ResponsiveWrapperProps) => {
  const isMobile = useIsMobile();
  const { isRTL } = useRTLLayout();
  
  const breakpointClasses = {
    sm: isMobile ? 'block sm:hidden' : 'hidden sm:block',
    md: isMobile ? 'block md:hidden' : 'hidden md:block', 
    lg: isMobile ? 'block lg:hidden' : 'hidden lg:block',
    xl: isMobile ? 'block xl:hidden' : 'hidden xl:block'
  };

  return (
    <div 
      className={cn(
        className,
        isMobile ? mobileClassName : desktopClassName,
        isRTL && 'rtl'
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {children}
    </div>
  );
};

// Mobile-only component
export const MobileOnly = ({ 
  children, 
  className,
  breakpoint = 'md' 
}: { 
  children: React.ReactNode; 
  className?: string;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const breakpointClasses = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden', 
    xl: 'xl:hidden'
  };

  return (
    <div className={cn('block', breakpointClasses[breakpoint], className)}>
      {children}
    </div>
  );
};

// Desktop-only component
export const DesktopOnly = ({ 
  children, 
  className,
  breakpoint = 'md' 
}: { 
  children: React.ReactNode; 
  className?: string;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const breakpointClasses = {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block'
  };

  return (
    <div className={cn(breakpointClasses[breakpoint], className)}>
      {children}
    </div>
  );
};

// Responsive Grid component
export const ResponsiveGrid = ({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 }
}: {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}) => {
  const gridClasses = cn(
    'grid gap-4',
    `grid-cols-${cols.mobile || 1}`,
    `md:grid-cols-${cols.tablet || 2}`,
    `lg:grid-cols-${cols.desktop || 3}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// Responsive container with consistent padding
export const ResponsiveContainer = ({
  children,
  className,
  maxWidth = '7xl',
  padding = 'responsive'
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'responsive';
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl', 
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2',
    md: 'px-4',
    lg: 'px-6',
    responsive: 'px-4 sm:px-6 lg:px-8'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

// Responsive flex layout
export const ResponsiveFlex = ({
  children,
  className,
  direction = { mobile: 'col', desktop: 'row' },
  align = 'center',
  justify = 'between',
  gap = '4'
}: {
  children: React.ReactNode;
  className?: string;
  direction?: {
    mobile?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    tablet?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    desktop?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '8';
}) => {
  const { isRTL } = useRTLLayout();
  
  const flexClasses = cn(
    'flex',
    `flex-${direction.mobile || 'col'}`,
    direction.tablet && `md:flex-${direction.tablet}`,
    direction.desktop && `lg:flex-${direction.desktop}`,
    `items-${align}`,
    `justify-${justify}`,
    `gap-${gap}`,
    isRTL && 'rtl-flex',
    className
  );

  return (
    <div className={flexClasses}>
      {children}
    </div>
  );
};

export default ResponsiveWrapper;