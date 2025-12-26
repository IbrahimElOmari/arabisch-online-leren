/**
 * RTL Debug Utilities
 * Development-only tools for diagnosing RTL layout issues
 */

interface RTLDebugInfo {
  documentDir: string | null;
  documentLang: string | null;
  htmlClasses: string;
  viewport: {
    innerWidth: number;
    clientWidth: number;
    scrollWidth: number;
    hasHorizontalOverflow: boolean;
  };
  meta: {
    viewportContent: string | null;
  };
  overflowingElements: Array<{
    selector: string;
    right: number;
    overflow: number;
  }>;
}

/**
 * Gather comprehensive RTL debug information
 */
export const gatherRTLDebugInfo = (): RTLDebugInfo | null => {
  if (typeof window === 'undefined') return null;

  const html = document.documentElement;
  const viewportMeta = document.querySelector('meta[name="viewport"]');

  // Find elements that overflow the viewport
  const overflowingElements: RTLDebugInfo['overflowingElements'] = [];
  const viewportWidth = window.innerWidth;

  document.querySelectorAll('*').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.right > viewportWidth + 1 && rect.width > 0) {
      // Create a useful selector
      let selector = el.tagName.toLowerCase();
      if (el.id) selector += `#${el.id}`;
      if (el.className && typeof el.className === 'string') {
        selector += `.${el.className.split(' ').slice(0, 2).join('.')}`;
      }

      overflowingElements.push({
        selector,
        right: Math.round(rect.right),
        overflow: Math.round(rect.right - viewportWidth),
      });
    }
  });

  return {
    documentDir: html.getAttribute('dir'),
    documentLang: html.getAttribute('lang'),
    htmlClasses: html.className,
    viewport: {
      innerWidth: window.innerWidth,
      clientWidth: html.clientWidth,
      scrollWidth: html.scrollWidth,
      hasHorizontalOverflow: html.scrollWidth > window.innerWidth + 1,
    },
    meta: {
      viewportContent: viewportMeta?.getAttribute('content') || null,
    },
    overflowingElements: overflowingElements.slice(0, 10), // Limit to first 10
  };
};

/**
 * Log RTL debug info to console
 */
export const logRTLDebugInfo = (): void => {
  if (!import.meta.env.DEV) return;

  const info = gatherRTLDebugInfo();
  if (!info) return;

  console.group('🔍 RTL Debug Info');
  console.log('Direction:', info.documentDir);
  console.log('Language:', info.documentLang);
  console.log('HTML Classes:', info.htmlClasses);
  console.log('Viewport:', info.viewport);
  console.log('Meta Viewport:', info.meta.viewportContent);
  
  if (info.viewport.hasHorizontalOverflow) {
    console.warn('⚠️ Horizontal overflow detected!');
    console.table(info.overflowingElements);
  } else {
    console.log('✅ No horizontal overflow');
  }
  
  console.groupEnd();
};

/**
 * Create a visual overlay showing overflow issues
 */
export const showOverflowOverlay = (): (() => void) => {
  if (!import.meta.env.DEV) return () => {};

  const info = gatherRTLDebugInfo();
  if (!info) return () => {};

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'rtl-debug-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 99999;
  `;

  // Draw vertical line at viewport edge
  const viewportLine = document.createElement('div');
  viewportLine.style.cssText = `
    position: absolute;
    top: 0;
    right: 0;
    width: 2px;
    height: 100%;
    background: red;
    opacity: 0.5;
  `;
  overlay.appendChild(viewportLine);

  // Add info panel
  const infoPanel = document.createElement('div');
  infoPanel.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    font-size: 12px;
    font-family: monospace;
    border-radius: 4px;
    max-width: 300px;
  `;
  infoPanel.innerHTML = `
    <strong>RTL Debug</strong><br>
    Dir: ${info.documentDir}<br>
    Lang: ${info.documentLang}<br>
    Viewport: ${info.viewport.innerWidth}px<br>
    ScrollWidth: ${info.viewport.scrollWidth}px<br>
    Overflow: ${info.viewport.hasHorizontalOverflow ? '❌ YES' : '✅ NO'}
    ${info.overflowingElements.length > 0 ? `<br><br>Overflowing:<br>${info.overflowingElements.map(e => `${e.selector}: +${e.overflow}px`).join('<br>')}` : ''}
  `;
  overlay.appendChild(infoPanel);

  document.body.appendChild(overlay);

  // Return cleanup function
  return () => {
    overlay.remove();
  };
};

/**
 * Verify RTL layout is correct
 * Returns true if all checks pass
 */
export const verifyRTLLayout = (): { passed: boolean; issues: string[] } => {
  const issues: string[] = [];
  const info = gatherRTLDebugInfo();

  if (!info) {
    return { passed: false, issues: ['Could not gather debug info'] };
  }

  // Check 1: No horizontal overflow
  if (info.viewport.hasHorizontalOverflow) {
    issues.push(`Horizontal overflow: scrollWidth (${info.viewport.scrollWidth}) > innerWidth (${info.viewport.innerWidth})`);
  }

  // Check 2: Viewport meta is standard
  if (info.meta.viewportContent?.includes('direction-lockable')) {
    issues.push('Viewport meta contains non-standard "direction-lockable"');
  }

  // Check 3: Dir and lang are in sync for RTL
  if (info.documentDir === 'rtl' && !['ar', 'ur', 'he', 'fa'].includes(info.documentLang || '')) {
    issues.push(`Dir is RTL but lang is "${info.documentLang}" (not an RTL language)`);
  }

  // Check 4: No elements overflow
  if (info.overflowingElements.length > 0) {
    issues.push(`${info.overflowingElements.length} elements overflow viewport`);
  }

  return {
    passed: issues.length === 0,
    issues,
  };
};

// Auto-run in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Log on load and language change
  window.addEventListener('load', () => {
    setTimeout(logRTLDebugInfo, 1000);
  });
}
