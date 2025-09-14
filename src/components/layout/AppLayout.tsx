
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/AppSidebar';
import Navigation from '@/components/Navigation';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import EnhancedNotificationSystem from '@/components/notifications/EnhancedNotificationSystem';
import { EnhancedMobileBottomNav } from '@/components/mobile/EnhancedMobileNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

export const AppLayout = () => {
  const { isRTL } = useRTLLayout();
  const { getNavigationAttributes } = useAccessibilityRTL();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div 
        className="min-h-screen flex w-full overflow-x-hidden" 
        {...getNavigationAttributes()}
      >
        <AppSidebar />
        
        <div className={`flex-1 min-w-0 flex flex-col main-content ${isMobile ? 'w-full' : ''}`}>
          <Navigation />
          <EnhancedNotificationSystem />
          
          <main 
            className="flex-1 w-full overflow-x-hidden" 
            role="main" 
            aria-label="Main content"
          >
            <Outlet />
          </main>

          {isMobile && <EnhancedMobileBottomNav />}
        </div>
      </div>
    </SidebarProvider>
  );
};
