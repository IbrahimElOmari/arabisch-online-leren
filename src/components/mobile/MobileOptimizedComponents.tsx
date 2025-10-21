import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

export const MobileBottomNav = () => {
  const location = useLocation();
  const { isRTL } = useRTLLayout();
  const { t } = useTranslation();
  
  const items = [
    { to: '/', label: t('nav.home', 'Home'), icon: Home },
    { to: '/taken', label: t('tasks.title', 'Taken'), icon: CheckSquare },
    { to: '/forum', label: t('nav.forum', 'Forum'), icon: MessageSquare },
  ];

  return (
    <nav 
      className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="navigation"
      aria-label={t('nav.navigation', 'Navigation')}
    >
      <ul className="grid grid-cols-3" role="list">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <li key={to} role="listitem">
              <Link
                to={to}
                className={cn(
                  'flex flex-col items-center py-3 px-2 text-xs transition-colors min-h-[56px] justify-center',
                  active ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md'
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={`${label}${active ? ` - ${t('common.current', 'Current page')}` : ''}`}
              >
                <Icon 
                  className="h-5 w-5 mb-1 transition-transform" 
                />
                <span className="text-center leading-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
