import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  container?: boolean;
}

export const ResponsiveGrid = ({ 
  children, 
  className, 
  cols = { default: 1, md: 2, lg: 3 },
  gap = 'md',
  container = false
}: ResponsiveGridProps) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 lg:gap-8'
  };

  const gridClasses = cn(
    'grid w-full max-w-full min-w-0',
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    gapClasses[gap],
    {
      'sm:grid-cols-2': container && cols.default === 1,
      'md:grid-cols-3': container && (cols.md || cols.default) >= 3,
    },
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};