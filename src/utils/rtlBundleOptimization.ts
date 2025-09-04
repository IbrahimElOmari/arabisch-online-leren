// RTL Bundle Optimization utilities for production builds

export const createRTLBundleSplitter = () => {
  const isRTL = document.dir === 'rtl' || document.documentElement.getAttribute('dir') === 'rtl';
  
  return {
    // Lazy load RTL-specific components
    loadRTLComponent: async (componentName: string) => {
      if (!isRTL) return null;
      
      try {
        const module = await import(`../components/rtl/${componentName}.tsx`);
        return module.default;
      } catch (error) {
        console.warn(`RTL component ${componentName} not found`);
        return null;
      }
    },

    // Conditional CSS loading
    loadRTLStyles: () => {
      if (!isRTL) return;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/assets/rtl-styles.css';
      link.media = 'all';
      document.head.appendChild(link);
    },

    // Arabic font subset optimization
    loadArabicFontSubset: () => {
      if (!isRTL) return;
      
      const fontFaces = [
        {
          family: 'Amiri',
          weight: '400',
          subset: 'arabic',
          url: 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.woff2'
        },
        {
          family: 'Noto Sans Arabic',
          weight: '400',
          subset: 'arabic',
          url: 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l-PI_A.woff2'
        }
      ];

      fontFaces.forEach(font => {
        const fontFace = new FontFace(font.family, `url(${font.url})`, {
          weight: font.weight,
          display: 'swap',
          unicodeRange: 'U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE80-FEFC'
        });
        
        fontFace.load().then(() => {
          document.fonts.add(fontFace);
        });
      });
    },

    // Performance monitoring for RTL bundles
    monitorRTLBundlePerformance: () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('rtl') || entry.name.includes('arabic')) {
            console.log(`RTL Bundle: ${entry.name} - ${entry.duration}ms`);
            
            // Send to analytics if available
            if (typeof window !== 'undefined' && 'gtag' in window) {
              (window as any).gtag('event', 'rtl_bundle_performance', {
                event_category: 'performance',
                event_label: entry.name,
                value: Math.round(entry.duration)
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource', 'navigation', 'measure'] });
    }
  };
};

// CSS minification for RTL-specific styles
export const minifyRTLCSS = (css: string): string => {
  return css
    .replace(/\/\*.*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, '}') // Remove last semicolon
    .replace(/\s*{\s*/g, '{') // Clean braces
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*,\s*/g, ',') // Clean commas
    .replace(/\s*:\s*/g, ':') // Clean colons
    .replace(/\s*;\s*/g, ';') // Clean semicolons
    .trim();
};

// RTL-specific code splitting
export const splitRTLCode = () => {
  return {
    // Core RTL utilities (always loaded)
    core: () => import('@/contexts/RTLContext'),
    
    // Advanced RTL features (lazy loaded)
    advanced: () => Promise.all([
      import('@/hooks/useRTLAnimations'),
      import('@/hooks/useRTLLayout'),
      import('@/hooks/useMobileRTL')
    ]),
    
    // RTL testing suite (dev only)
    testing: () => {
      if (process.env.NODE_ENV === 'development') {
        return Promise.all([
          import('@/components/rtl/RTLTestRunner'),
          import('@/components/rtl/RTLPerformanceMonitor')
        ]);
      }
      return Promise.resolve([]);
    },
    
    // Arabic-specific utilities
    arabic: () => Promise.all([
      import('@/hooks/useArabicNumerals'),
      import('@/utils/arabicUtils')
    ])
  };
};

// Initialize RTL optimizations
export const initializeRTLOptimizations = () => {
  const splitter = createRTLBundleSplitter();
  
  // Load critical RTL resources
  splitter.loadRTLStyles();
  splitter.loadArabicFontSubset();
  
  // Start performance monitoring
  if (process.env.NODE_ENV === 'production') {
    splitter.monitorRTLBundlePerformance();
  }
  
  return splitter;
};