import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

interface EnhancedBreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
  separator?: React.ReactNode;
}

const defaultRouteLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/admin': 'Beheer',
  '/forum': 'Forum',
  '/profile': 'Profiel',
  '/leerstof': 'Leerstof',
  '/taken': 'Taken',
  '/analytics': 'Analytics',
  '/security': 'Beveiliging',
  '/calendar': 'Kalender',
  '/lesson-organization': 'Les Organisatie',
  '/offline-content': 'Offline Content',
};

export const EnhancedBreadcrumbs = ({
  items: customItems,
  showHome = true,
  className,
  separator
}: EnhancedBreadcrumbsProps) => {
  const location = useLocation();
  const { isRTL, getFlexDirection } = useRTLLayout();
  const { t } = useTranslation();
  
  // Generate breadcrumb items from current path if not provided
  const generateBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      breadcrumbs.push({
        label: defaultRouteLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
        isActive: isLast
      });
    });
    
    return breadcrumbs;
  };

  const items = customItems || generateBreadcrumbsFromPath();
  
  // Don't show breadcrumbs if we're on home page and only have dashboard
  if (!customItems && (location.pathname === '/' || location.pathname === '/dashboard')) {
    return null;
  }

  const ChevronIcon = isRTL ? 
    () => <ChevronRight className="h-4 w-4 rotate-180 text-muted-foreground" /> :
    () => <ChevronRight className="h-4 w-4 text-muted-foreground" />;

  const defaultSeparator = separator || <ChevronIcon />;

  return (
    <nav 
      aria-label={t('nav.breadcrumb', 'Breadcrumb navigatie')}
      className={cn(
        'flex items-center space-x-1 text-sm text-muted-foreground mb-4',
        isRTL && 'space-x-reverse',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ol className={cn(
        'flex items-center space-x-1',
        isRTL && 'space-x-reverse'
      )}>
        {showHome && (
          <>
            <li>
              <Link
                to="/dashboard"
                className={cn(
                  'flex items-center gap-1 hover:text-foreground transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-sm px-1',
                  location.pathname === '/dashboard' && 'text-foreground font-medium'
                )}
              >
                <Home className="h-4 w-4" />
                <span className={cn(isRTL && 'arabic-text')}>
                  {t('nav.home', 'Dashboard')}
                </span>
              </Link>
            </li>
            {items.length > 0 && (
              <li aria-hidden="true" className="flex">
                {defaultSeparator}
              </li>
            )}
          </>
        )}
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li>
              {item.href && !item.isActive ? (
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1 hover:text-foreground transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-sm px-1',
                    isRTL && 'flex-row-reverse'
                  )}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className={cn(
                    'truncate',
                    isRTL && 'arabic-text'
                  )}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span 
                  className={cn(
                    'flex items-center gap-1 text-foreground font-medium',
                    isRTL && 'flex-row-reverse arabic-text'
                  )}
                  aria-current="page"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </span>
              )}
            </li>
            
            {index < items.length - 1 && (
              <li aria-hidden="true" className="flex">
                {defaultSeparator}
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default EnhancedBreadcrumbs;