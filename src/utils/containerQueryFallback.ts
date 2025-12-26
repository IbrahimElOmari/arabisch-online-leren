/**
 * Container Query Fallback Detection
 * Detects if browser supports container queries and adds fallback class if not
 */

export const initContainerQueryFallback = (): boolean => {
  const supportsContainerQueries = CSS.supports?.('container-type', 'inline-size') ?? false;
  
  if (!supportsContainerQueries) {
    document.documentElement.classList.add('no-container-queries');
    console.warn('[RTL Debug] Browser does not support container queries - fallback activated');
  }
  
  // Log current RTL state for debugging
  if (import.meta.env.DEV) {
    console.log('[RTL Debug] Container query support:', supportsContainerQueries);
    console.log('[RTL Debug] Document dir:', document.documentElement.dir);
    console.log('[RTL Debug] Document lang:', document.documentElement.lang);
  }
  
  return supportsContainerQueries;
};

/**
 * Debug helper to check main content visibility
 * Call this from console: window.checkRTLContentVisibility()
 */
export const checkRTLContentVisibility = (): void => {
  const main = document.querySelector('main');
  if (!main) {
    console.error('[RTL Debug] No <main> element found');
    return;
  }
  
  const rect = main.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  
  console.log('[RTL Debug] Main element bounds:', {
    x: rect.x,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    viewportWidth,
    isVisible: rect.left >= 0 && rect.right <= viewportWidth,
    documentDir: document.documentElement.dir,
    scrollLeft: document.scrollingElement?.scrollLeft ?? 0,
    scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
    clientWidth: document.scrollingElement?.clientWidth ?? 0
  });
  
  // Check for overlaying elements
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const elementsAtCenter = document.elementsFromPoint(centerX, centerY);
  
  const overlays = elementsAtCenter.filter(el => 
    el !== main && 
    !main.contains(el) && 
    el.tagName !== 'HTML' && 
    el.tagName !== 'BODY'
  );
  
  if (overlays.length > 0) {
    console.warn('[RTL Debug] Elements overlaying main content:', overlays);
  } else {
    console.log('[RTL Debug] No overlaying elements detected');
  }
};

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).checkRTLContentVisibility = checkRTLContentVisibility;
}
