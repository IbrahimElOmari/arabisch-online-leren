import React, { useEffect } from 'react';
import { RTLProvider } from '@/contexts/RTLContext';
import { preloadArabicFonts, injectCriticalRTLCSS, monitorRTLPerformance } from '@/utils/performanceRTL';
import { initializeCrossBrowserRTL } from '@/utils/crossBrowserRTL';

interface EnhancedRTLProviderProps {
  children: React.ReactNode;
  enablePerformanceMonitoring?: boolean;
  enableCrossBrowserSupport?: boolean;
}

export const EnhancedRTLProvider: React.FC<EnhancedRTLProviderProps> = ({ 
  children, 
  enablePerformanceMonitoring = true,
  enableCrossBrowserSupport = true 
}) => {
  useEffect(() => {
    // Initialize RTL performance optimizations
    preloadArabicFonts();
    injectCriticalRTLCSS();

    // Initialize cross-browser support
    if (enableCrossBrowserSupport) {
      initializeCrossBrowserRTL();
    }

    // Start performance monitoring in development
    if (enablePerformanceMonitoring && process.env.NODE_ENV === 'development') {
      const cleanup = monitorRTLPerformance();
      return cleanup;
    }
  }, [enablePerformanceMonitoring, enableCrossBrowserSupport]);

  return (
    <RTLProvider>
      {children}
    </RTLProvider>
  );
};