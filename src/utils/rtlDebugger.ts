/**
 * RTL Debug Utilities
 * Development-only tools for diagnosing RTL layout issues
 */

interface MainElementDebug {
  found: boolean;
  rect: {
    x: number;
    left: number;
    right: number;
    width: number;
    height: number;
  } | null;
  isVisible: boolean;
  isWithinViewport: boolean;
  computed: {
    position: string;
    transform: string;
    translate: string;
    left: string;
    right: string;
    marginLeft: string;
    marginRight: string;
    marginInlineStart: string;
    marginInlineEnd: string;
    insetInlineStart: string;
    insetInlineEnd: string;
    display: string;
    flex: string;
    width: string;
  } | null;
  offset: {
    offsetLeft: number;
    offsetWidth: number;
    clientWidth: number;
    offsetParent: string | null;
  } | null;
}

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
  mainElement: MainElementDebug;
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
  const viewportWidth = window.innerWidth;

  // Gather main element debug info
  const main = document.querySelector('main');
  let mainElementDebug: MainElementDebug;
  
  if (main) {
    const rect = main.getBoundingClientRect();
    const computed = window.getComputedStyle(main);
    const isVisible = rect.x >= -10 && rect.width > 100 && rect.height > 0;
    const isWithinViewport = rect.left >= -10 && rect.left < viewportWidth;
    
    // Get offsetParent info
    const offsetParent = main.offsetParent as HTMLElement | null;
    let offsetParentSelector: string | null = null;
    if (offsetParent) {
      offsetParentSelector = offsetParent.tagName.toLowerCase();
      if (offsetParent.id) offsetParentSelector += `#${offsetParent.id}`;
      if (offsetParent.className) offsetParentSelector += `.${offsetParent.className.split(' ')[0]}`;
    }
    
    mainElementDebug = {
      found: true,
      rect: {
        x: Math.round(rect.x),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      isVisible,
      isWithinViewport,
      computed: {
        position: computed.position,
        transform: computed.transform,
        translate: computed.translate || 'none',
        left: computed.left,
        right: computed.right,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        marginInlineStart: computed.marginInlineStart || 'N/A',
        marginInlineEnd: computed.marginInlineEnd || 'N/A',
        insetInlineStart: computed.insetInlineStart || 'N/A',
        insetInlineEnd: computed.insetInlineEnd || 'N/A',
        display: computed.display,
        flex: computed.flex,
        width: computed.width,
      },
      offset: {
        offsetLeft: main.offsetLeft,
        offsetWidth: main.offsetWidth,
        clientWidth: main.clientWidth,
        offsetParent: offsetParentSelector,
      },
    };
  } else {
    mainElementDebug = {
      found: false,
      rect: null,
      isVisible: false,
      isWithinViewport: false,
      computed: null,
      offset: null,
    };
  }

  // Find elements that overflow the viewport
  const overflowingElements: RTLDebugInfo['overflowingElements'] = [];

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
    mainElement: mainElementDebug,
    overflowingElements: overflowingElements.slice(0, 10),
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
  
  // Log main element details
  console.group('📦 Main Element');
  if (info.mainElement.found) {
    console.log('Rect:', info.mainElement.rect);
    console.log('Is Visible:', info.mainElement.isVisible);
    console.log('Within Viewport:', info.mainElement.isWithinViewport);
    console.log('Computed Styles:', info.mainElement.computed);
    console.log('Offset Info:', info.mainElement.offset);
    
    if (!info.mainElement.isVisible || !info.mainElement.isWithinViewport) {
      console.error('❌ MAIN ELEMENT NOT VISIBLE - Layout broken!');
    }
  } else {
    console.warn('⚠️ No <main> element found');
  }
  console.groupEnd();
  
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

/**
 * Check if main content is visible within viewport
 * Useful for detecting if content is pushed offscreen in RTL mode
 */
export const checkMainContentVisibility = (): { visible: boolean; issues: string[] } => {
  if (typeof window === 'undefined') {
    return { visible: true, issues: [] };
  }

  const issues: string[] = [];
  const main = document.querySelector('main');
  
  if (!main) {
    return { visible: false, issues: ['No <main> element found'] };
  }

  const rect = main.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  // Check if main is pushed left (negative x)
  if (rect.x < -10) {
    issues.push(`Main content pushed left: x=${Math.round(rect.x)}px`);
  }

  // Check if main is pushed right beyond viewport
  if (rect.left > viewportWidth) {
    issues.push(`Main content pushed offscreen right: left=${Math.round(rect.left)}px, viewport=${viewportWidth}px`);
  }

  // Check if main has zero or near-zero width
  if (rect.width < 100) {
    issues.push(`Main content has minimal width: ${Math.round(rect.width)}px`);
  }

  // Check if main content is visible in viewport
  const isVisible = rect.x >= -10 && 
                   rect.left < viewportWidth && 
                   rect.width > 100 &&
                   rect.height > 0;

  if (!isVisible && issues.length === 0) {
    issues.push('Main content not visible for unknown reason');
  }

  if (import.meta.env.DEV && issues.length > 0) {
    console.warn('⚠️ Main content visibility issues:', issues);
    console.log('Main bounding rect:', {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      right: rect.right,
    });
  }

  return { visible: isVisible, issues };
};

/**
 * Detect which element (if any) is covering main content
 * Useful for finding overlay/drawer issues
 */
export const detectOverlayOverMain = (): { blocking: boolean; element: string | null } => {
  if (typeof window === 'undefined') {
    return { blocking: false, element: null };
  }

  const main = document.querySelector('main');
  if (!main) {
    return { blocking: false, element: null };
  }

  const rect = main.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Get element at center of main
  const elementAtCenter = document.elementFromPoint(centerX, centerY);

  if (!elementAtCenter) {
    return { blocking: false, element: null };
  }

  // Check if the element is main or a child of main
  if (main.contains(elementAtCenter) || elementAtCenter === main) {
    return { blocking: false, element: null };
  }

  // Something is covering main
  let selector = elementAtCenter.tagName.toLowerCase();
  if (elementAtCenter.id) selector += `#${elementAtCenter.id}`;
  if (elementAtCenter.className && typeof elementAtCenter.className === 'string') {
    selector += `.${elementAtCenter.className.split(' ').slice(0, 2).join('.')}`;
  }

  if (import.meta.env.DEV) {
    console.warn('⚠️ Element blocking main content:', selector, elementAtCenter);
  }

  return { blocking: true, element: selector };
};

// Auto-run in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Log on load and language change
  window.addEventListener('load', () => {
    setTimeout(() => {
      logRTLDebugInfo();
      checkMainContentVisibility();
    }, 1000);
  });

  // Monitor dir/lang changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        const attr = mutation.attributeName;
        if (attr === 'dir' || attr === 'lang') {
          console.log(`📌 HTML ${attr} changed to:`, document.documentElement.getAttribute(attr));
          setTimeout(() => {
            checkMainContentVisibility();
            const overlay = detectOverlayOverMain();
            if (overlay.blocking) {
              console.warn('⚠️ Overlay detected after attribute change:', overlay.element);
            }
          }, 100);
        }
      }
    });
  });

  observer.observe(document.documentElement, { attributes: true });
}
