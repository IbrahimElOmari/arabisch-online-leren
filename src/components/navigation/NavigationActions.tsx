
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { SearchCommand } from '@/components/ui/search-command';
import { UserDropdown } from '@/components/ui/UserDropdown';
import { RTLToggle } from '@/components/ui/RTLToggle';
import { LogIn } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

interface NavigationActionsProps {
  user: any;
}

export const NavigationActions = React.memo(({ user }: NavigationActionsProps) => {
  const navigate = useNavigate();
  const { getFlexDirection, getMarginStart, getMarginEnd } = useRTLLayout();
  const { t } = useTranslation();

  return (
    <div className={`${getFlexDirection()} items-center gap-4`}>
      <SearchCommand />
      <RTLToggle />
      
      {user ? (
        <>
          <NotificationBell />
          <UserDropdown />
        </>
      ) : (
        <div className={`hidden sm:${getFlexDirection()} items-center gap-2`}>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-9 px-3"
            onClick={() => navigate('/auth')}
          >
            <LogIn className={`h-4 w-4 ${getMarginEnd('2')}`} />
            {t('nav.login')}
          </Button>
          <Button 
            size="sm"
            className="h-9 px-4"
            onClick={() => navigate('/auth')}
          >
            {t('nav.register')}
          </Button>
        </div>
      )}
    </div>
  );
});

NavigationActions.displayName = 'NavigationActions';
