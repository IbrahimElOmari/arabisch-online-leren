import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MobileBottomNav = () => {
  const location = useLocation();
  const items = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/taken', label: 'Taken', icon: CheckSquare },
    { to: '/forum', label: 'Forum', icon: MessageSquare },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <ul className="grid grid-cols-3">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  'flex flex-col items-center py-2 text-xs transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
