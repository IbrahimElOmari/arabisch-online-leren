/**
 * Critical CSS utility for performance optimization
 * Handles above-the-fold CSS extraction and deferred loading
 */

// Critical CSS classes that are always needed for initial page load
const CRITICAL_CSS_CLASSES = [
  // Layout essentials
  'bg-background',
  'text-foreground',
  'border-border',
  'main-content-card',
  'floating-content',
  // Navigation
  'sidebar',
  'navbar',
  // Loading states
  'loading',
  'spinner',
  // Basic typography
  'text-sm',
  'text-base',
  'text-lg',
  'font-medium',
  'font-semibold',
  // Essential spacing
  'p-4',
  'p-6',
  'm-4',
  'space-y-4',
  // Essential flexbox/grid
  'flex',
  'grid',
  'items-center',
  'justify-center',
  // Essential colors from design system
  'text-primary',
  'bg-primary',
  'text-secondary',
  'bg-secondary',
];

/**
 * Determines if a CSS class is critical for initial render
 */
export function isCriticalCSS(className: string): boolean {
  return CRITICAL_CSS_CLASSES.some(critical => 
    className.includes(critical) || critical.includes(className)
  );
}

/**
 * Loads non-critical CSS with low priority
 */
export function loadNonCriticalCSS(href: string, id?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (id) link.id = id;
    
    // Use low priority loading
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
      resolve();
    };
    link.onerror = reject;
    
    document.head.appendChild(link);
  });
}

/**
 * Preload critical fonts
 */
export function preloadCriticalFonts(): void {
  const fonts = [
    { href: '/fonts/inter.woff2', type: 'font/woff2' },
  ];

  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font.href;
    link.as = 'font';
    link.type = font.type;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Initialize critical CSS optimizations
 */
export function initializeCriticalCSS(): void {
  // Preload critical fonts
  preloadCriticalFonts();
  
  // Remove unused CSS classes in production
  if (import.meta.env.PROD) {
    // This would be handled by the build process
    console.log('Critical CSS optimizations initialized');
  }
}