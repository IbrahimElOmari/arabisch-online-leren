// Cross-browser RTL compatibility utilities

export const detectRTLSupport = () => {
  if (typeof window === 'undefined') return false;
  
  return CSS.supports('direction', 'rtl') || 
         CSS.supports('-webkit-logical-width', 'auto') ||
         CSS.supports('-moz-logical-width', 'auto');
};

export const injectRTLPolyfills = () => {
  if (typeof window === 'undefined') return;

  // Safari RTL fixes
  if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
    const style = document.createElement('style');
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
  }

  // Firefox RTL fixes
  if (navigator.userAgent.includes('Firefox')) {
    const style = document.createElement('style');
    style.textContent = `
      [dir="rtl"] {
        -moz-text-size-adjust: none;
      }
      [dir="rtl"] .arabic-text {
        font-feature-settings: "kern" 1;
      }
    `;
    document.head.appendChild(style);
  }

  // Chrome RTL optimizations
  if (navigator.userAgent.includes('Chrome')) {
    const style = document.createElement('style');
    style.textContent = `
      [dir="rtl"] .arabic-text {
        font-display: swap;
        text-rendering: optimizeLegibility;
      }
    `;
    document.head.appendChild(style);
  }
};

export const addRTLViewportMeta = () => {
  if (typeof window === 'undefined') return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      viewport.getAttribute('content') + ', direction-lockable=false'
    );
  }
};

export const enableRTLScrollbarFix = () => {
  if (typeof window === 'undefined') return;

  // Fix scrollbar position in RTL
  const style = document.createElement('style');
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

  console.log('RTL Browser Compatibility:', tests);
  return tests;
};

export const initializeCrossBrowserRTL = () => {
  if (typeof window === 'undefined') return;

  // Run all cross-browser fixes
  injectRTLPolyfills();
  addRTLViewportMeta();
  enableRTLScrollbarFix();
  
  // Test compatibility in development
  if (process.env.NODE_ENV === 'development') {
    testRTLCompatibility();
  }
};