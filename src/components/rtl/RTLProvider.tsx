import React, { useEffect } from 'react';
import { RTLProvider, useRTL } from '@/contexts/RTLContext';
import { preloadArabicFonts, injectCriticalRTLCSS, createRTLPerformanceMonitor } from '@/utils/performanceRTL';
import { initializeCrossBrowserRTL } from '@/utils/crossBrowserRTL';

interface EnhancedRTLProviderProps {
  children: React.ReactNode;
  enablePerformanceMonitoring?: boolean;
  enableCrossBrowserSupport?: boolean;
}

const RTLPerformanceWrapper: React.FC<{ 
  children: React.ReactNode; 
  enablePerformanceMonitoring: boolean;
}> = ({ children, enablePerformanceMonitoring }) => {
  const { isRTL } = useRTL();
  
  useEffect(() => {
    if (enablePerformanceMonitoring && process.env.NODE_ENV === 'development') {
      const cleanup = createRTLPerformanceMonitor(isRTL);
      return cleanup;
    }
  }, [isRTL, enablePerformanceMonitoring]);

  return <>{children}</>;
};

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
  }, [enableCrossBrowserSupport]);

  return (
    <RTLProvider>
      <RTLPerformanceWrapper enablePerformanceMonitoring={enablePerformanceMonitoring}>
        {children}
      </RTLPerformanceWrapper>
    </RTLProvider>
  );
};