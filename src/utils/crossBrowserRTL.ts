// Cross-browser RTL compatibility utilities
// FIXED: Removed non-standard viewport-meta mutations that caused layout issues

export const detectRTLSupport = () => {
  if (typeof window === 'undefined') return false;
  
  return CSS.supports('direction', 'rtl') || 
         CSS.supports('-webkit-logical-width', 'auto') ||
         CSS.supports('-moz-logical-width', 'auto');
};

export const injectRTLPolyfills = () => {
  if (typeof window === 'undefined') return;

  // Prevent duplicate injection
  if (document.getElementById('rtl-polyfills-injected')) return;

  // Safari RTL fixes
  if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
    const style = document.createElement('style');
    style.id = 'rtl-polyfills-injected';
    style.textContent = `
      [dir="rtl"] {
        -webkit-text-size-adjust: 100%;
      }
      [dir="rtl"] .arabic-text {
        font-synthesis: none;
        -webkit-font-feature-settings: "kern" 1;
      }
    `;
    document.head.appendChild(style);
    return;
  }

  // Firefox RTL fixes
  if (navigator.userAgent.includes('Firefox')) {
    const style = document.createElement('style');
    style.id = 'rtl-polyfills-injected';
    style.textContent = `
      [dir="rtl"] {
        -moz-text-size-adjust: none;
      }
      [dir="rtl"] .arabic-text {
        font-feature-settings: "kern" 1;
      }
    `;
    document.head.appendChild(style);
    return;
  }

  // Chrome RTL optimizations
  if (navigator.userAgent.includes('Chrome')) {
    const style = document.createElement('style');
    style.id = 'rtl-polyfills-injected';
    style.textContent = `
      [dir="rtl"] .arabic-text {
        font-display: swap;
        text-rendering: optimizeLegibility;
      }
    `;
    document.head.appendChild(style);
  }
};

/**
 * FIX 2: Ensure viewport meta uses ONLY standard values
 * Removes any non-standard parameters like 'direction-lockable=false'
 */
export const ensureStandardViewportMeta = () => {
  if (typeof window === 'undefined') return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    // Reset to standard viewport values - NEVER add non-standard params
    const standardContent = 'width=device-width, initial-scale=1, viewport-fit=cover';
    const currentContent = viewport.getAttribute('content') || '';
    
    // Only update if it contains non-standard values
    if (currentContent.includes('direction-lockable') || 
        currentContent !== standardContent) {
      viewport.setAttribute('content', standardContent);
    }
  }
};

export const enableRTLScrollbarFix = () => {
  if (typeof window === 'undefined') return;
  
  // Prevent duplicate injection
  if (document.getElementById('rtl-scrollbar-fix')) return;

  // Fix scrollbar position in RTL
  const style = document.createElement('style');
  style.id = 'rtl-scrollbar-fix';
  style.textContent = `
    [dir="rtl"]::-webkit-scrollbar {
      width: 8px;
    }
    
    [dir="rtl"]::-webkit-scrollbar-track {
      background: hsl(var(--muted));
      border-radius: 4px;
    }
    
    [dir="rtl"]::-webkit-scrollbar-thumb {
      background: hsl(var(--muted-foreground) / 0.3);
      border-radius: 4px;
    }
    
    [dir="rtl"]::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--muted-foreground) / 0.5);
    }
  `;
  document.head.appendChild(style);
};

export const testRTLCompatibility = () => {
  const tests = {
    directionSupport: CSS.supports('direction', 'rtl'),
    logicalProperties: CSS.supports('margin-inline-start', '1rem'),
    textAlign: CSS.supports('text-align', 'start'),
    flexDirection: CSS.supports('flex-direction', 'row-reverse'),
    gridAutoFlow: CSS.supports('grid-auto-flow', 'row-reverse'),
  };

  if (import.meta.env.DEV) {
    console.log('RTL Browser Compatibility:', tests);
  }
  return tests;
};

/**
 * FIX 4: Development-only overflow detector
 * Logs elements that extend beyond viewport in RTL mode
 */
export const detectOverflowingElements = () => {
  if (!import.meta.env.DEV) return [];
  if (typeof window === 'undefined') return [];

  const overflowingElements: Array<{ element: string; right: number; viewportWidth: number }> = [];
  const viewportWidth = window.innerWidth;

  document.querySelectorAll('*').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.right > viewportWidth + 1) {
      overflowingElements.push({
        element: `${el.tagName}.${el.className}`,
        right: rect.right,
        viewportWidth,
      });
    }
  });

  if (overflowingElements.length > 0) {
    console.warn('🚨 RTL Overflow detected:', overflowingElements.slice(0, 10));
  }

  return overflowingElements;
};

/**
 * Verify viewport measurements match hardware width
 */
export const verifyViewportIntegrity = () => {
  if (typeof window === 'undefined') return null;

  const measurements = {
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    isValid: true,
    hasHorizontalOverflow: false,
  };

  // Check if scrollWidth exceeds viewport (indicates overflow)
  measurements.hasHorizontalOverflow = measurements.scrollWidth > measurements.innerWidth + 1;
  measurements.isValid = !measurements.hasHorizontalOverflow;

  if (import.meta.env.DEV && measurements.hasHorizontalOverflow) {
    console.warn('🚨 Viewport integrity issue:', measurements);
    detectOverflowingElements();
  }

  return measurements;
};

// Initialization - runs once
let initialized = false;

export const initializeCrossBrowserRTL = () => {
  if (typeof window === 'undefined') return;
  if (initialized) return;
  
  initialized = true;

  // Run all cross-browser fixes
  injectRTLPolyfills();
  ensureStandardViewportMeta(); // FIX 2: Use standard viewport only
  enableRTLScrollbarFix();
  
  // Test compatibility in development
  if (import.meta.env.DEV) {
    testRTLCompatibility();
    // Delayed check for overflow after layout settles
    setTimeout(() => {
      verifyViewportIntegrity();
    }, 500);
  }
};
