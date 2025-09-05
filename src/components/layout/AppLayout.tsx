
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/AppSidebar';
import Navigation from '@/components/Navigation';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import EnhancedNotificationSystem from '@/components/notifications/EnhancedNotificationSystem';
import { MobileBottomNav } from '@/components/mobile/MobileOptimizedComponents';
import { useIsMobile } from '@/hooks/use-mobile';

export const AppLayout = () => {
  const { getFlexDirection, isRTL } = useRTLLayout();
  const { getNavigationAttributes } = useAccessibilityRTL();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${getFlexDirection()}`} {...getNavigationAttributes()}>
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <Navigation />
          <EnhancedNotificationSystem />
          
          <main className="flex-1" role="main" aria-label="Main content">
            <Outlet />
          </main>

          {isMobile && <MobileBottomNav />}
        </div>
      </div>
    </SidebarProvider>
  );
};
