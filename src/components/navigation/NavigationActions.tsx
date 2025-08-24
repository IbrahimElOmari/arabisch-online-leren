
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { SearchCommand } from '@/components/ui/search-command';
import { UserDropdown } from '@/components/ui/UserDropdown';
import { LogIn } from 'lucide-react';

interface NavigationActionsProps {
  user: any;
}

export const NavigationActions = React.memo(({ user }: NavigationActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center space-x-4">
      <SearchCommand />
      
      {user ? (
        <>
          <NotificationBell />
          <UserDropdown />
        </>
      ) : (
        <div className="hidden sm:flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-9 px-3"
            onClick={() => navigate('/auth')}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Inloggen
          </Button>
          <Button 
            size="sm"
            className="h-9 px-4"
            onClick={() => navigate('/auth')}
          >
            Registreren
          </Button>
        </div>
      )}
    </div>
  );
});

NavigationActions.displayName = 'NavigationActions';
