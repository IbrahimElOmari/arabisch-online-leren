/**
 * AppLayout - Main application layout
 * FIX 5: Simplified mobile layout - sidebar via drawer, not flex-child
 * FIX: Added ErrorBoundary around Outlet for catching runtime errors
 */

import { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/AppSidebar';
import Navigation from '@/components/Navigation';
import { useRTL } from '@/contexts/RTLContext';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import EnhancedNotificationSystem from '@/components/notifications/EnhancedNotificationSystem';
import { EnhancedMobileBottomNav } from '@/components/mobile/EnhancedMobileNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardErrorBoundary } from '@/components/layout/DashboardErrorBoundary';
import { initRTLMainVisibilityGuard, forceGuardCheck } from '@/utils/rtlMainVisibilityGuard';

type RTLDebugFlags = {
  rtlDebug: boolean;
  noSidebar: boolean;
  noBottomNav: boolean;
  noHeader: boolean;
};

const getDebugFlags = (): RTLDebugFlags => {
  if (typeof window === 'undefined') {
    return { rtlDebug: false, noSidebar: false, noBottomNav: false, noHeader: false };
  }

  const sp = new URLSearchParams(window.location.search);
  return {
    rtlDebug: sp.get('rtlDebug') === '1',
    noSidebar: sp.get('noSidebar') === '1',
    noBottomNav: sp.get('noBottomNav') === '1',
    noHeader: sp.get('noHeader') === '1',
  };
};

export const AppLayout = () => {
  const { isRTL } = useRTL();
  const { getNavigationAttributes } = useAccessibilityRTL();
  const isMobile = useIsMobile();

  // Debug flags to isolate which layout component hides main content on RTL mobile.
  // Usage (DEV): add query params e.g.
  //   ?rtlDebug=1&noSidebar=1&noBottomNav=1&noHeader=1
  const debug = useMemo(() => getDebugFlags(), []);

  // Initialize RTL main visibility guard (production-safe failsafe)
  useEffect(() => {
    const cleanup = initRTLMainVisibilityGuard();
    return cleanup;
  }, []);

  // Re-check guard when RTL/mobile state changes
  useEffect(() => {
    forceGuardCheck();
  }, [isRTL, isMobile]);

  useEffect(() => {
    if (!import.meta.env.DEV || !debug.rtlDebug) return;

    let cancelled = false;

    (async () => {
      // Dynamic import so this never impacts production bundles.
      const rtl = await import('@/utils/rtlDebugger');
      if (cancelled) return;

      rtl.logRTLDebugInfo?.();

      const mainCheck = rtl.checkMainContentVisibility?.();
      const overlay = rtl.detectOverlayOverMain?.();

      const main = document.querySelector('main');
      const rect = main?.getBoundingClientRect();
      const cs = main ? window.getComputedStyle(main) : null;

      console.group('[RTL Debug] AppLayout probe');
      console.log({
        route: window.location.pathname,
        debug,
        dir: document.documentElement.getAttribute('dir'),
        lang: document.documentElement.getAttribute('lang'),
        isRTL,
        isMobile,
        mainCheck,
        overlay,
        mainRect: rect,
        mainStyle: cs
          ? {
              display: cs.display,
              visibility: cs.visibility,
              opacity: cs.opacity,
              transform: cs.transform,
              overflowX: cs.overflowX,
              position: cs.position,
              zIndex: cs.zIndex,
            }
          : null,
      });
      console.groupEnd();

      // Also run the helper from containerQueryFallback if present
      (window as any).checkRTLContentVisibility?.();
    })().catch((e) => console.error('[RTL Debug] probe failed', e));

    return () => {
      cancelled = true;
    };
  }, [debug, isRTL, isMobile]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div
        className="min-h-screen bg-background w-full max-w-[100vw] overflow-x-clip"
        style={{ minWidth: 0 }}
      >
        <div
          className="flex min-h-screen w-full max-w-[100vw]"
          style={{ minWidth: 0, maxWidth: '100vw' }}
          {...getNavigationAttributes()}
        >
          {/* Sidebar: renders as Sheet on mobile, fixed on desktop */}
          {/* On mobile, AppSidebar returns a Sheet (overlay) not a flex child */}
          {!debug.noSidebar && <AppSidebar />}

          {/* Content column - CRITICAL: w-0 min-w-0 flex-1 prevents flex collapse */}
          {/* On mobile RTL this MUST take full width regardless of sidebar */}
          <div
            className="flex-1 flex flex-col w-0 min-w-0 max-w-[100vw] overflow-x-clip"
            style={{ 
              flex: '1 1 0%',
              minWidth: 0,
              maxWidth: '100vw',
              width: isMobile ? '100%' : undefined,
            }}
            data-content-column
          >
            {!debug.noHeader && <Navigation />}
            <EnhancedNotificationSystem />

            <main
              className="flex-1 p-4 w-full min-w-0 max-w-[100vw] overflow-x-clip"
              style={{ 
                flex: '1 1 100%',
                minWidth: 0,
                width: '100%',
                maxWidth: '100vw',
              }}
              role="main"
              aria-label="Main content"
              data-main="app"
            >
              <DashboardErrorBoundary>
                <Outlet />
              </DashboardErrorBoundary>
            </main>
          </div>
        </div>

        {/* Mobile: bottom nav only - sidebar is already rendered as Sheet */}
        {isMobile && !debug.noBottomNav && <EnhancedMobileBottomNav />}
      </div>
    </SidebarProvider>
  );
};
