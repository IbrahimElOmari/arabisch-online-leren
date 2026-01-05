/**
 * RTL Main Visibility Guard
 * Production-safe failsafe that auto-fixes main element position if out of bounds
 * 
 * This is a safety net - even if CSS fails to load correctly or future changes
 * introduce regression, this will ensure main content remains visible.
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
  maxLeftOffset: 50,
  /** Minimum width as percentage of viewport */
  minWidthPercent: 0.5,
  /** Delay before checking (allow layout to settle) */
  checkDelayMs: 100,
  /** How many animation frames to wait */
  rafFrames: 2,
};

let guardActive = false;
let lastFixApplied = 0;

/**
 * Check if main element is out of bounds
 */
function isMainOutOfBounds(main: HTMLElement, viewportWidth: number): boolean {
  const rect = main.getBoundingClientRect();
  
  // Main is pushed off-screen to the right
  if (rect.left > viewportWidth) return true;
  
  // Main is too narrow (collapsed)
  if (rect.width < viewportWidth * GUARD_CONFIG.minWidthPercent) return true;
  
  // Main is significantly offset
  if (rect.left > GUARD_CONFIG.maxLeftOffset) return true;
  
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
 * Apply inline fix to main element and optionally its parent
 */
function applyFix(main: HTMLElement, fixParent: boolean = false): void {
  const fixStyles: Partial<CSSStyleDeclaration> = {
    position: 'relative',
    left: '0px',
    right: '0px',
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
  };
  
  Object.assign(main.style, fixStyles);
  lastFixApplied = Date.now();
  
  // Also fix parent container if requested (content column)
  if (fixParent && main.parentElement) {
    const parent = main.parentElement;
    parent.style.flex = '1 1 0%';
    parent.style.minWidth = '0px';
    parent.style.width = '100%';
    parent.style.maxWidth = '100vw';
  }
}

/**
 * Get the correct main element - prefer the app's main, not page-level mains
 */
function getAppMain(): HTMLElement | null {
  // Prefer main with our data attribute
  const appMain = document.querySelector('main[data-main="app"]');
  if (appMain instanceof HTMLElement) return appMain;
  
  // Fallback to main with role
  const roleMain = document.querySelector('main[role="main"]');
  if (roleMain instanceof HTMLElement) return roleMain;
  
  // Last resort: first main
  const firstMain = document.querySelector('main');
  if (firstMain instanceof HTMLElement) return firstMain;
  
  return null;
}

/**
 * Run synchronous visibility check - executes IMMEDIATELY without waiting
 * This catches layout issues before the user sees them
 */
function runSynchronousCheck(): void {
  const html = document.documentElement;
  const isRTL = html.dir === 'rtl' || html.classList.contains('rtl-mode');
  const isMobile = window.innerWidth <= 768;
  
  // Only run in RTL + mobile
  if (!isRTL || !isMobile) return;
  
  const main = getAppMain();
  if (!main) return;
  
  const rect = main.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  
  // Check if out of bounds OR too narrow
  const outOfBounds = rect.left > GUARD_CONFIG.maxLeftOffset;
  const tooNarrow = rect.width < viewportWidth * GUARD_CONFIG.minWidthPercent;
  
  if (outOfBounds || tooNarrow) {
    if (import.meta.env.DEV) {
      console.warn('[RTL Guard] Synchronous fix applied', {
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        viewportWidth,
        reason: outOfBounds ? 'out-of-bounds' : 'too-narrow',
      });
    }
    
    // Fix both main and its parent container
    applyFix(main, true);
    html.classList.add('rtl-main-fixed');
  }
}

/**
 * Run the visibility guard check (async version with RAF delays)
 */
async function runGuardCheck(): Promise<void> {
  const html = document.documentElement;
  const isRTL = html.dir === 'rtl' || html.classList.contains('rtl-mode');
  const isMobile = window.innerWidth <= 768;
  
  // Only run in RTL + mobile
  if (!isRTL || !isMobile) return;
  
  const main = getAppMain();
  if (!main) return;
  
  const viewportWidth = window.innerWidth;
  
  // Wait for RAF frames
  for (let i = 0; i < GUARD_CONFIG.rafFrames; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
  
  // Additional delay for layout
  await new Promise(resolve => setTimeout(resolve, GUARD_CONFIG.checkDelayMs));
  
  if (!isMainOutOfBounds(main, viewportWidth)) {
    return; // All good
  }
  
  // Main is out of bounds - collect before snapshot
  const beforeSnapshot = getSnapshot(main);
  
  if (import.meta.env.DEV) {
    console.warn('[RTL Guard] Main element out of bounds detected!', {
      before: beforeSnapshot,
      isRTL,
      isMobile,
      htmlClasses: html.className,
    });
  }
  
  // Apply fix to main AND parent
  applyFix(main, true);
  
  // Add marker class
  html.classList.add('rtl-main-fixed');
  
  // Collect after snapshot
  const afterSnapshot = getSnapshot(main);
  
  if (import.meta.env.DEV) {
    console.log('[RTL Guard] Fix applied', {
      before: beforeSnapshot,
      after: afterSnapshot,
      fixed: !isMainOutOfBounds(main, viewportWidth),
    });
  }
}

/**
 * Initialize the RTL main visibility guard
 * Call this from AppLayout or main.tsx
 */
export function initRTLMainVisibilityGuard(): () => void {
  if (guardActive) {
    return () => {}; // Already active
  }
  
  guardActive = true;
  
  // CRITICAL: Run synchronous check FIRST (no waiting)
  runSynchronousCheck();
  
  // Run async check as backup (with RAF delays)
  runGuardCheck();
  
  // Listen for relevant events
  const handleChange = () => {
    // Debounce
    if (Date.now() - lastFixApplied < 500) return;
    runGuardCheck();
  };
  
  // Observe attribute changes on html
  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some(m => 
      m.attributeName === 'dir' || 
      m.attributeName === 'lang' || 
      m.attributeName === 'class'
    );
    if (relevant) handleChange();
  });
  
  observer.observe(document.documentElement, { 
    attributes: true,
    attributeFilter: ['dir', 'lang', 'class'],
  });
  
  // Listen for resize/orientation
  window.addEventListener('resize', handleChange);
  window.addEventListener('orientationchange', handleChange);
  
  // Cleanup function
  return () => {
    guardActive = false;
    observer.disconnect();
    window.removeEventListener('resize', handleChange);
    window.removeEventListener('orientationchange', handleChange);
  };
}

/**
 * Force a guard check (useful after navigation or state changes)
 */
export function forceGuardCheck(): void {
  runGuardCheck();
}

// Export for DEV debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).rtlGuard = {
    forceCheck: forceGuardCheck,
    getConfig: () => GUARD_CONFIG,
  };
}
