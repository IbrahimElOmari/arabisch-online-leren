
import React from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { NavigationHeader } from '@/components/navigation/NavigationHeader';
import { NavigationMenuItems } from '@/components/navigation/NavigationMenuItems';
import { NavigationActions } from '@/components/navigation/NavigationActions';

/**
 * Main navigation component that provides site-wide navigation functionality
 * Optimized with React.memo and split into smaller, focused sub-components
 */
const Navigation = React.memo(() => {
  const { user, profile } = useAuth();

  return (
    <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavigationHeader />
          <NavigationMenuItems user={user} profile={profile} />
          <NavigationActions user={user} />
        </div>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
