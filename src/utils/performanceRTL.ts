import { useRTL } from '@/contexts/RTLContext';

// Font loading optimization for Arabic fonts
export const preloadArabicFonts = () => {
  if (typeof window === 'undefined') return;

  const arabicFonts = [
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap'
  ];

  arabicFonts.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  });
};

// Critical CSS for RTL
export const injectCriticalRTLCSS = () => {
  if (typeof window === 'undefined') return;

  const criticalCSS = `
    [dir="rtl"] { direction: rtl; text-align: right; }
    [dir="rtl"] .arabic-text { font-family: 'Amiri', serif; }
    [dir="rtl"] .flex { flex-direction: row-reverse; }
    .rtl-skeleton { animation: rtl-skeleton-loading 1.5s infinite; }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

// Lazy load non-critical RTL components
export const useLazyRTLComponents = () => {
  const { isRTL } = useRTL();

  const loadRTLComponent = async (componentName: string) => {
    if (!isRTL) return null;
    
    try {
      const module = await import(`../components/rtl/${componentName}.tsx`);
      return module.default;
    } catch (error) {
      if (import.meta.env.DEV) console.warn(`RTL component ${componentName} not found`);
      return null;
    }
  };

  return { loadRTLComponent };
};

// Bundle optimization for RTL
export const optimizeRTLBundle = () => {
  // Tree-shake unused RTL utilities based on current direction
  const { isRTL } = useRTL();
  
  return {
    shouldLoadRTLAnimations: isRTL,
    shouldLoadArabicFonts: isRTL,
    shouldLoadRTLPolyfills: isRTL && !CSS.supports('direction', 'rtl'),
  };
};

// Image loading optimization for RTL layouts
export const optimizeRTLImages = () => {
  if (typeof window === 'undefined') return;

  const images = document.querySelectorAll('img[data-rtl]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const rtlSrc = img.dataset.rtlSrc;
        if (rtlSrc && document.dir === 'rtl') {
          img.src = rtlSrc;
        }
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => observer.observe(img));
};

// Performance monitoring for RTL - now only works inside React components
export const createRTLPerformanceMonitor = (isRTL: boolean) => {
  if (typeof window === 'undefined') return;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('rtl') || entry.name.includes('arabic')) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`RTL Performance: ${entry.name} took ${entry.duration}ms`);
        }
      }
    }
  });

  observer.observe({ entryTypes: ['measure', 'navigation'] });

  // Mark RTL-specific performance points
  if (isRTL) {
    performance.mark('rtl-start');
    
    return () => {
      performance.mark('rtl-end');
      performance.measure('rtl-total', 'rtl-start', 'rtl-end');
      observer.disconnect();
    };
  }
  
  return () => observer.disconnect();
};