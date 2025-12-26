/**
 * AppLayout - Main application layout
 * FIX 5: Simplified mobile layout - sidebar via drawer, not flex-child
 */

import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/AppSidebar';
import Navigation from '@/components/Navigation';
import { useRTL } from '@/contexts/RTLContext';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import EnhancedNotificationSystem from '@/components/notifications/EnhancedNotificationSystem';
import { EnhancedMobileBottomNav } from '@/components/mobile/EnhancedMobileNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

export const AppLayout = () => {
  const { isRTL } = useRTL();
  const { getNavigationAttributes } = useAccessibilityRTL();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={false}>
      {/* 
        FIX 4: Anti-overflow contract on root container
        - max-w-[100vw] prevents exceeding viewport
        - overflow-x-clip clips overflow without affecting scrolling
      */}
      <div 
        className="min-h-screen bg-background w-full max-w-[100vw] overflow-x-clip"
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{ minWidth: 0 }} // FIX 4: Prevents flex items from overflowing
      >
        <div 
          className="flex min-h-screen w-full max-w-[100vw]" 
          style={{ minWidth: 0 }}
          {...getNavigationAttributes()}
        >
          {/* 
            FIX 5: On mobile, sidebar is rendered but hidden via CSS
            It appears as a drawer overlay, not affecting main content flow
          */}
          {!isMobile && <AppSidebar />}
          
          {/* 
            Main content container - always full width on mobile
            FIX 4: min-w-0 prevents flex child from exceeding parent
          */}
          <div 
            className="flex-1 flex flex-col w-full max-w-[100vw] overflow-x-clip"
            style={{ minWidth: 0 }}
          >
            <Navigation />
            <EnhancedNotificationSystem />
            
            <main 
              className="flex-1 p-4 w-full max-w-[100vw] overflow-x-clip" 
              style={{ minWidth: 0 }}
              role="main" 
              aria-label="Main content"
            >
              <Outlet />
            </main>
          </div>
        </div>

        {/* 
          FIX 5: Mobile navigation as portal/overlay
          Doesn't affect main content layout 
        */}
        {isMobile && (
          <>
            <AppSidebar /> {/* Renders as drawer on mobile */}
            <EnhancedMobileBottomNav />
          </>
        )}
      </div>
    </SidebarProvider>
  );
};
