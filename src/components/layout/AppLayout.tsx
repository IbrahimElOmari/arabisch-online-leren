
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/AppSidebar';
import Navigation from '@/components/Navigation';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';

export const AppLayout = () => {
  const { getFlexDirection, isRTL } = useRTLLayout();
  const { getNavigationAttributes } = useAccessibilityRTL();

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${getFlexDirection()}`} {...getNavigationAttributes()}>
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <Navigation />
          
          <main className="flex-1" role="main" aria-label="Main content">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
