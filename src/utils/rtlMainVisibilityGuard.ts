/**
 * RTL Main Visibility Guard
 * Production-safe failsafe that auto-fixes main element position if out of bounds
 * 
 * REFACTORED: Enhanced with ResizeObserver and MutationObserver for persistent monitoring
 */

interface MainRectSnapshot {
  left: number;
  right: number;
  width: number;
  viewportWidth: number;
  timestamp: number;
}

const GUARD_CONFIG = {
  /** Maximum allowed left offset before triggering fix */
  maxLeftOffset: 10,
  /** Minimum width as percentage of viewport */
  minWidthPercent: 0.8,
  /** Maximum x position as percentage of viewport */
  maxXPercent: 0.05,
  /** Delay before async check */
  checkDelayMs: 30,
  /** Debounce interval */
  debounceMs: 100,
};

let guardActive = false;
let lastFixApplied = 0;
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;

/**
 * Check if main element is out of bounds
 */
function isMainOutOfBounds(main: HTMLElement, viewportWidth: number): boolean {
  const rect = main.getBoundingClientRect();
  
  // Main is pushed off-screen to the right
  if (rect.left > viewportWidth) return true;
  
  // Main is too narrow (collapsed)
  if (rect.width < viewportWidth * GUARD_CONFIG.minWidthPercent) return true;
  
  // Main is significantly offset (absolute threshold)
  if (rect.left > GUARD_CONFIG.maxLeftOffset) return true;
  
  // Main x position is more than threshold of viewport
  if (rect.x > viewportWidth * GUARD_CONFIG.maxXPercent) return true;
  
  return false;
}

/**
 * Get snapshot of main element rect
 */
function getSnapshot(main: HTMLElement): MainRectSnapshot {
  const rect = main.getBoundingClientRect();
  return {
    left: Math.round(rect.left),
    right: Math.round(rect.right),
    width: Math.round(rect.width),
    viewportWidth: window.innerWidth,
    timestamp: Date.now(),
  };
}

/**
 * Apply inline fix to main element and its ancestors
 */
function applyFix(main: HTMLElement): void {
  const fixStyles: Partial<CSSStyleDeclaration> = {
    position: 'relative',
    left: '0px',
    right: '0px',
    insetInlineStart: 'auto',
    insetInlineEnd: 'auto',
    transform: 'none',
    translate: 'none',
    marginLeft: '0px',
    marginRight: '0px',
    marginInlineStart: '0px',
    marginInlineEnd: '0px',
    width: '100%',
    maxWidth: '100vw',
    minWidth: '0px',
    flex: '1 1 100%',
    boxSizing: 'border-box',
    visibility: 'visible',
    opacity: '1',
    display: 'block',
    padding: '1rem',
  };
  
  Object.assign(main.style, fixStyles);
  lastFixApplied = Date.now();
  
  // Fix parent (content column)
  const parent = main.parentElement;
  if (parent && parent.hasAttribute('data-content-column')) {
    parent.style.flex = '1 1 0%';
    parent.style.minWidth = '0px';
    parent.style.width = '100%';
    parent.style.maxWidth = '100vw';
    parent.style.display = 'flex';
    parent.style.flexDirection = 'column';
  }
  
  // Fix grandparent (app row)
  const grandparent = parent?.parentElement;
  if (grandparent && grandparent.hasAttribute('data-app-row')) {
    grandparent.style.width = '100%';
    grandparent.style.maxWidth = '100vw';
    grandparent.style.minWidth = '0px';
  }
  
  // Mark as fixed
  document.documentElement.classList.add('rtl-main-fixed');
}

/**
 * Get the app's main element
 */
function getAppMain(): HTMLElement | null {
  const appMain = document.querySelector('main[data-main="app"]');
  if (appMain instanceof HTMLElement) return appMain;
  
  const roleMain = document.querySelector('main[role="main"]');
  if (roleMain instanceof HTMLElement) return roleMain;
  
  const firstMain = document.querySelector('main');
  if (firstMain instanceof HTMLElement) return firstMain;
  
  return null;
}

/**
 * Check if we should run the guard (RTL + mobile)
 */
function shouldRunGuard(): boolean {
  const html = document.documentElement;
  const isRTL = html.dir === 'rtl' || html.classList.contains('rtl-mode');
  const isMobile = window.innerWidth <= 1024;
  return isRTL && isMobile;
}

/**
 * Run synchronous visibility check - executes IMMEDIATELY
 */
function runSynchronousCheck(): void {
  if (!shouldRunGuard()) return;
  
  const main = getAppMain();
  if (!main) return;
  
  const viewportWidth = window.innerWidth;
  
  if (isMainOutOfBounds(main, viewportWidth)) {
    if (import.meta.env.DEV) {
      const rect = main.getBoundingClientRect();
      console.warn('[RTL Guard] Synchronous fix applied', {
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        viewportWidth,
      });
    }
    applyFix(main);
  }
}

/**
 * Run async visibility check with RAF delay
 */
async function runAsyncCheck(): Promise<void> {
  if (!shouldRunGuard()) return;
  
  const main = getAppMain();
  if (!main) return;
  
  // Wait for RAF
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  // Small delay for layout
  await new Promise(resolve => setTimeout(resolve, GUARD_CONFIG.checkDelayMs));
  
  const viewportWidth = window.innerWidth;
  
  if (isMainOutOfBounds(main, viewportWidth)) {
    const beforeSnapshot = getSnapshot(main);
    
    if (import.meta.env.DEV) {
      console.warn('[RTL Guard] Async fix applied', { before: beforeSnapshot });
    }
    
    applyFix(main);
    
    if (import.meta.env.DEV) {
      const afterSnapshot = getSnapshot(main);
      console.log('[RTL Guard] Fix result', { before: beforeSnapshot, after: afterSnapshot });
    }
  }
}

/**
 * Debounced handler for observers
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedCheck(): void {
  if (Date.now() - lastFixApplied < GUARD_CONFIG.debounceMs) return;
  
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runSynchronousCheck();
  }, GUARD_CONFIG.debounceMs);
}

/**
 * Setup ResizeObserver on main element
 */
function setupResizeObserver(main: HTMLElement): void {
  if (resizeObserver) resizeObserver.disconnect();
  
  resizeObserver = new ResizeObserver(() => {
    if (shouldRunGuard()) {
      debouncedCheck();
    }
  });
  
  resizeObserver.observe(main);
  
  // Also observe parent if exists
  if (main.parentElement) {
    resizeObserver.observe(main.parentElement);
  }
}

/**
 * Setup MutationObserver on ancestors
 */
function setupMutationObserver(main: HTMLElement): void {
  if (mutationObserver) mutationObserver.disconnect();
  
  mutationObserver = new MutationObserver((mutations) => {
    const relevant = mutations.some(m => 
      m.attributeName === 'class' || 
      m.attributeName === 'style'
    );
    if (relevant && shouldRunGuard()) {
      debouncedCheck();
    }
  });
  
  // Observe main and its ancestors
  let el: HTMLElement | null = main;
  while (el && el !== document.body) {
    mutationObserver.observe(el, { 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });
    el = el.parentElement;
  }
}

/**
 * Initialize the RTL main visibility guard
 */
export function initRTLMainVisibilityGuard(): () => void {
  if (guardActive) {
    return () => {};
  }
  
  guardActive = true;
  
  // Run immediate check
  runSynchronousCheck();
  
  // Run async check as backup
  runAsyncCheck();
  
  // Setup observers when main element is available
  const setupObservers = () => {
    const main = getAppMain();
    if (main) {
      setupResizeObserver(main);
      setupMutationObserver(main);
    }
  };
  
  // Try immediately, and retry after short delay if not found
  setupObservers();
  setTimeout(setupObservers, 100);
  setTimeout(setupObservers, 500);
  
  // Listen for attribute changes on html
  const htmlObserver = new MutationObserver((mutations) => {
    const relevant = mutations.some(m => 
      m.attributeName === 'dir' || 
      m.attributeName === 'lang' || 
      m.attributeName === 'class'
    );
    if (relevant) {
      runSynchronousCheck();
      runAsyncCheck();
    }
  });
  
  htmlObserver.observe(document.documentElement, { 
    attributes: true,
    attributeFilter: ['dir', 'lang', 'class'],
  });
  
  // Listen for resize/orientation
  const handleResize = () => {
    if (shouldRunGuard()) {
      runSynchronousCheck();
    }
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  // Cleanup function
  return () => {
    guardActive = false;
    htmlObserver.disconnect();
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}

/**
 * Force a guard check
 */
export function forceGuardCheck(): void {
  runSynchronousCheck();
  runAsyncCheck();
}

// Export for DEV debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).rtlGuard = {
    forceCheck: forceGuardCheck,
    getConfig: () => GUARD_CONFIG,
    getMainRect: () => {
      const main = getAppMain();
      return main ? getSnapshot(main) : null;
    },
  };
}
