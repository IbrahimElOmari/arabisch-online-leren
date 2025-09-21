
import React from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { EnhancedNavigationHeader } from '@/components/navigation/EnhancedNavigationHeader';



/**
 * Main navigation component that provides site-wide navigation functionality
 * Enhanced with global search, notifications, and improved UX
 */
const Navigation = React.memo(() => {
  return <EnhancedNavigationHeader />;
});

Navigation.displayName = 'Navigation';

export default Navigation;
