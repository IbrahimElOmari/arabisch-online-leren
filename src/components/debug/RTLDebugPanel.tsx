/**
 * RTL Debug Panel - DEV-only component for debugging RTL layout issues
 * Enable via URL param: ?rtlDebug=1
 * 
 * ENHANCED: Now includes detailed computed styles, cache reset, and failsafe marker
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Copy, RefreshCw, Bug, Menu, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MainComputedStyles {
  width: string;
  maxWidth: string;
  minWidth: string;
  position: string;
  left: string;
  right: string;
  transform: string;
  translate: string;
  marginLeft: string;
  marginRight: string;
  marginInlineStart: string;
  marginInlineEnd: string;
  insetInlineStart: string;
  insetInlineEnd: string;
  display: string;
  flex: string;
  alignSelf: string;
}

interface MainOffsetInfo {
  offsetLeft: number;
  offsetWidth: number;
  clientWidth: number;
  offsetParent: string | null;
}

interface DebugData {
  timestamp: string;
  documentDir: string;
  documentLang: string;
  htmlClasses: string;
  containerQuerySupport: boolean;
  noContainerQueriesClass: boolean;
  rtlMainFixedClass: boolean;
  viewport: {
    width: number;
    height: number;
  };
  scroll: {
    scrollLeft: number;
    scrollWidth: number;
    clientWidth: number;
    hasHorizontalOverflow: boolean;
  };
  mainElement: {
    found: boolean;
    rect?: {
      x: number;
      left: number;
      right: number;
      width: number;
    };
    isVisible: boolean;
    isWithinViewport: boolean;
    computed?: MainComputedStyles;
    offset?: MainOffsetInfo;
    safeguardActive?: boolean;
    ancestors?: Array<{
      tag: string;
      id?: string;
      className?: string;
      rect: { x: number; left: number; right: number; width: number };
      computed: {
        display: string;
        position: string;
        transform: string;
        overflowX: string;
        direction: string;
      };
    }>;
  };
  overlayElements: string[];
  drawerTest?: {
    passed: boolean;
    beforeScroll: { scrollLeft: number; scrollWidth: number };
    afterScroll: { scrollLeft: number; scrollWidth: number };
    message: string;
  };
}

export const RTLDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [drawerTestResult, setDrawerTestResult] = useState<DebugData['drawerTest'] | null>(null);
  const { toast } = useToast();
  const testInProgress = useRef(false);

  const collectDebugData = useCallback((): DebugData => {
    const html = document.documentElement;
    const main = document.querySelector('main');
    const scrollingElement = document.scrollingElement || document.documentElement;
    
    const containerQuerySupport = CSS.supports?.('container-type', 'inline-size') ?? false;
    const noContainerQueriesClass = html.classList.contains('no-container-queries');
    const rtlMainFixedClass = html.classList.contains('rtl-main-fixed');
    
    let mainData: DebugData['mainElement'] = {
      found: false,
      isVisible: false,
      isWithinViewport: false,
    };
    
    let overlayElements: string[] = [];
    
    if (main && main instanceof HTMLElement) {
      const rect = main.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const cs = window.getComputedStyle(main);

      // Collect detailed computed styles
      const computed: MainComputedStyles = {
        width: cs.width,
        maxWidth: cs.maxWidth,
        minWidth: cs.minWidth,
        position: cs.position,
        left: cs.left,
        right: cs.right,
        transform: cs.transform,
        translate: cs.translate || 'none',
        marginLeft: cs.marginLeft,
        marginRight: cs.marginRight,
        marginInlineStart: cs.marginInlineStart || cs.getPropertyValue('margin-inline-start') || 'N/A',
        marginInlineEnd: cs.marginInlineEnd || cs.getPropertyValue('margin-inline-end') || 'N/A',
        insetInlineStart: cs.insetInlineStart || cs.getPropertyValue('inset-inline-start') || 'N/A',
        insetInlineEnd: cs.insetInlineEnd || cs.getPropertyValue('inset-inline-end') || 'N/A',
        display: cs.display,
        flex: cs.flex,
        alignSelf: cs.alignSelf,
      };

      // Collect offset info
      const offset: MainOffsetInfo = {
        offsetLeft: main.offsetLeft,
        offsetWidth: main.offsetWidth,
        clientWidth: main.clientWidth,
        offsetParent: main.offsetParent 
          ? `${main.offsetParent.tagName.toLowerCase()}${main.offsetParent.id ? '#' + main.offsetParent.id : ''}${main.offsetParent.className ? '.' + main.offsetParent.className.toString().split(' ')[0] : ''}`
          : null,
      };

      // Check if mobile RTL safeguard is active
      const safeguardActive = cs.position === 'relative' && 
        (cs.translate === 'none' || cs.translate === '0px 0px' || !cs.translate) &&
        cs.transform === 'none';

      const ancestors: NonNullable<DebugData['mainElement']['ancestors']> = [];
      let el: HTMLElement | null = main as HTMLElement;
      for (let i = 0; el && i < 10; i++) {
        const r = el.getBoundingClientRect();
        const elCs = window.getComputedStyle(el);
        ancestors.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          className: el.className ? el.className.toString().slice(0, 160) : undefined,
          rect: {
            x: Math.round(r.x),
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
          },
          computed: {
            display: elCs.display,
            position: elCs.position,
            transform: elCs.transform,
            overflowX: elCs.overflowX,
            direction: elCs.direction,
          },
        });
        el = el.parentElement as HTMLElement | null;
      }
      
      mainData = {
        found: true,
        rect: {
          x: Math.round(rect.x),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        },
        isVisible: rect.left >= -10 && rect.right <= viewportWidth + 10,
        isWithinViewport: rect.left >= 0 && rect.right <= viewportWidth,
        computed,
        offset,
        safeguardActive,
        ancestors,
      };
      
      // Check for overlaying elements
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      if (centerX >= 0 && centerX <= viewportWidth && centerY >= 0 && centerY <= window.innerHeight) {
        const elements = document.elementsFromPoint(centerX, centerY);
        overlayElements = elements
          .filter(el => 
            el !== main && 
            !main.contains(el) && 
            el.tagName !== 'HTML' && 
            el.tagName !== 'BODY'
          )
          .map(el => {
            const classes = el.className ? `.${el.className.toString().split(' ').slice(0, 2).join('.')}` : '';
            return `${el.tagName.toLowerCase()}${classes}`;
          })
          .slice(0, 5);
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      documentDir: html.dir || 'not set',
      documentLang: html.lang || 'not set',
      htmlClasses: Array.from(html.classList).join(' ') || 'none',
      containerQuerySupport,
      noContainerQueriesClass,
      rtlMainFixedClass,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scroll: {
        scrollLeft: Math.round(scrollingElement.scrollLeft),
        scrollWidth: Math.round(scrollingElement.scrollWidth),
        clientWidth: Math.round(scrollingElement.clientWidth),
        hasHorizontalOverflow: scrollingElement.scrollWidth > scrollingElement.clientWidth,
      },
      mainElement: mainData,
      overlayElements,
      drawerTest: drawerTestResult || undefined,
    };
  }, [drawerTestResult]);

  const refreshDebugData = useCallback(() => {
    setDebugData(collectDebugData());
  }, [collectDebugData]);

  // Reset cache and reload
  const handleCacheReset = useCallback(async () => {
    toast({
      title: 'Resetting cache...',
      description: 'Clearing all caches and reloading',
    });
    
    try {
      // Use the global reset function if available
      if (typeof (window as any).forceServiceWorkerReset === 'function') {
        await (window as any).forceServiceWorkerReset();
      } else {
        // Manual fallback
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
        }
        window.location.reload();
      }
    } catch (error) {
      console.error('Cache reset failed:', error);
      window.location.reload();
    }
  }, [toast]);

  // Test drawer open/close effect on scroll
  const runDrawerTest = useCallback(async () => {
    if (testInProgress.current) return;
    testInProgress.current = true;
    
    const scrollingElement = document.scrollingElement || document.documentElement;
    const beforeScroll = {
      scrollLeft: Math.round(scrollingElement.scrollLeft),
      scrollWidth: Math.round(scrollingElement.scrollWidth),
    };
    
    const menuButton = document.querySelector('[data-testid="mobile-menu-trigger"]') || 
                       document.querySelector('button[class*="md:hidden"]');
    
    if (menuButton && menuButton instanceof HTMLElement) {
      menuButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[RTL Debug] During drawer open - scrollLeft:', scrollingElement.scrollLeft, 'scrollWidth:', scrollingElement.scrollWidth);
      
      const closeButton = document.querySelector('[data-radix-collection-item]') ||
                          document.querySelector('button[class*="SheetClose"]') ||
                          document.querySelector('[role="dialog"] button');
      
      if (closeButton && closeButton instanceof HTMLElement) {
        closeButton.click();
      } else {
        const overlay = document.querySelector('[data-radix-overlay]');
        if (overlay && overlay instanceof HTMLElement) {
          overlay.click();
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const afterScroll = {
        scrollLeft: Math.round(scrollingElement.scrollLeft),
        scrollWidth: Math.round(scrollingElement.scrollWidth),
      };
      
      const passed = 
        beforeScroll.scrollLeft === afterScroll.scrollLeft &&
        beforeScroll.scrollWidth === afterScroll.scrollWidth;
      
      const result: DebugData['drawerTest'] = {
        passed,
        beforeScroll,
        afterScroll,
        message: passed 
          ? '✓ PASSED: Drawer open/close does not affect scroll' 
          : '✗ FAILED: Drawer changed scroll values',
      };
      
      setDrawerTestResult(result);
      toast({
        title: passed ? 'Drawer Test Passed' : 'Drawer Test Failed',
        description: result.message,
        variant: passed ? 'default' : 'destructive',
      });
    } else {
      setDrawerTestResult({
        passed: false,
        beforeScroll,
        afterScroll: beforeScroll,
        message: '⚠ No mobile menu button found (test only works on mobile viewport)',
      });
    }
    
    testInProgress.current = false;
    refreshDebugData();
  }, [toast, refreshDebugData]);

  const copyDebugReport = useCallback(() => {
    const data = collectDebugData();
    const report = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(report).then(() => {
      toast({
        title: 'Debug report copied',
        description: 'Paste this in your bug report or chat',
      });
    });
  }, [collectDebugData, toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldShow = params.get('rtlDebug') === '1';
    
    if (shouldShow && import.meta.env.DEV) {
      setIsVisible(true);
      setDebugData(collectDebugData());
    }
  }, [collectDebugData]);

  useEffect(() => {
    if (!isVisible) return;
    
    const handleUpdate = () => {
      setDebugData(collectDebugData());
    };
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    
    const interval = setInterval(handleUpdate, 2000);
    
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      clearInterval(interval);
    };
  }, [isVisible, collectDebugData]);

  // Don't render in production
  if (!import.meta.env.DEV || !isVisible) {
    return null;
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 z-[9999] bg-destructive text-destructive-foreground p-2 rounded-full shadow-lg"
        title="Open RTL Debug Panel"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-4 z-[9999] w-96 max-h-[80vh] overflow-auto shadow-xl border-2 border-destructive/50 bg-background/95 backdrop-blur text-xs">
      <CardHeader className="pb-2 flex flex-row items-center justify-between sticky top-0 bg-background/95 z-10">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bug className="h-4 w-4" />
          RTL Debug Panel
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshDebugData} title="Refresh">
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyDebugReport} title="Copy Report">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCacheReset} title="Reset Cache & Reload">
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(true)} title="Minimize">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {debugData && (
          <>
            {/* Direction & Language */}
            <div>
              <div className="font-semibold mb-1">Document</div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">dir:</span>
                <Badge variant={debugData.documentDir === 'rtl' ? 'default' : 'secondary'} className="text-xs">
                  {debugData.documentDir}
                </Badge>
                <span className="text-muted-foreground">lang:</span>
                <span>{debugData.documentLang}</span>
                <span className="text-muted-foreground">classes:</span>
                <span className="text-[10px] truncate">{debugData.htmlClasses}</span>
              </div>
            </div>

            {/* Safeguard Status */}
            <div>
              <div className="font-semibold mb-1">Safeguards</div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">CSS Active:</span>
                <Badge variant={debugData.mainElement.safeguardActive ? 'default' : 'destructive'} className="text-xs">
                  {debugData.mainElement.safeguardActive ? 'Yes' : 'NO!'}
                </Badge>
                <span className="text-muted-foreground">JS Fixed:</span>
                <Badge variant={debugData.rtlMainFixedClass ? 'default' : 'secondary'} className="text-xs">
                  {debugData.rtlMainFixedClass ? 'Applied' : 'Not needed'}
                </Badge>
              </div>
            </div>

            {/* Viewport */}
            <div>
              <div className="font-semibold mb-1">Viewport</div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Size:</span>
                <span>{debugData.viewport.width} × {debugData.viewport.height}</span>
              </div>
            </div>

            {/* Scroll */}
            <div>
              <div className="font-semibold mb-1">Scroll</div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">scrollLeft:</span>
                <span className={debugData.scroll.scrollLeft !== 0 ? 'text-destructive font-bold' : ''}>
                  {debugData.scroll.scrollLeft}
                </span>
                <span className="text-muted-foreground">scrollWidth:</span>
                <span>{debugData.scroll.scrollWidth}</span>
                <span className="text-muted-foreground">Overflow:</span>
                <Badge variant={debugData.scroll.hasHorizontalOverflow ? 'destructive' : 'default'} className="text-xs">
                  {debugData.scroll.hasHorizontalOverflow ? 'Yes!' : 'No'}
                </Badge>
              </div>
            </div>

            {/* Main Element Rect */}
            <div>
              <div className="font-semibold mb-1">Main Element (Rect)</div>
              {debugData.mainElement.found ? (
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">x/left:</span>
                  <span className={debugData.mainElement.rect!.x > 10 ? 'text-destructive font-bold' : 'text-green-600'}>
                    {debugData.mainElement.rect!.x}
                  </span>
                  <span className="text-muted-foreground">width:</span>
                  <span className={debugData.mainElement.rect!.width < 300 ? 'text-destructive font-bold' : ''}>
                    {debugData.mainElement.rect!.width}
                  </span>
                  <span className="text-muted-foreground">Visible:</span>
                  <Badge variant={debugData.mainElement.isVisible ? 'default' : 'destructive'} className="text-xs">
                    {debugData.mainElement.isVisible ? 'Yes' : 'NO!'}
                  </Badge>
                </div>
              ) : (
                <Badge variant="destructive">NOT FOUND</Badge>
              )}
            </div>

            {/* Main Element Computed Styles */}
            {debugData.mainElement.computed && (
              <div>
                <div className="font-semibold mb-1">Main Computed Styles</div>
                <div className="grid grid-cols-2 gap-0.5 text-[10px]">
                  <span className="text-muted-foreground">position:</span>
                  <span className={debugData.mainElement.computed.position !== 'relative' ? 'text-warning' : ''}>
                    {debugData.mainElement.computed.position}
                  </span>
                  <span className="text-muted-foreground">left:</span>
                  <span>{debugData.mainElement.computed.left}</span>
                  <span className="text-muted-foreground">right:</span>
                  <span>{debugData.mainElement.computed.right}</span>
                  <span className="text-muted-foreground">transform:</span>
                  <span className={debugData.mainElement.computed.transform !== 'none' ? 'text-destructive' : ''}>
                    {debugData.mainElement.computed.transform}
                  </span>
                  <span className="text-muted-foreground">translate:</span>
                  <span className={debugData.mainElement.computed.translate !== 'none' && debugData.mainElement.computed.translate !== '0px 0px' ? 'text-destructive' : ''}>
                    {debugData.mainElement.computed.translate}
                  </span>
                  <span className="text-muted-foreground">marginL/R:</span>
                  <span>{debugData.mainElement.computed.marginLeft} / {debugData.mainElement.computed.marginRight}</span>
                  <span className="text-muted-foreground">marginInline:</span>
                  <span>{debugData.mainElement.computed.marginInlineStart} / {debugData.mainElement.computed.marginInlineEnd}</span>
                  <span className="text-muted-foreground">width:</span>
                  <span>{debugData.mainElement.computed.width}</span>
                  <span className="text-muted-foreground">flex:</span>
                  <span>{debugData.mainElement.computed.flex}</span>
                </div>
              </div>
            )}

            {/* Main Element Offset */}
            {debugData.mainElement.offset && (
              <div>
                <div className="font-semibold mb-1">Main Offset Info</div>
                <div className="grid grid-cols-2 gap-0.5 text-[10px]">
                  <span className="text-muted-foreground">offsetLeft:</span>
                  <span>{debugData.mainElement.offset.offsetLeft}</span>
                  <span className="text-muted-foreground">offsetWidth:</span>
                  <span>{debugData.mainElement.offset.offsetWidth}</span>
                  <span className="text-muted-foreground">clientWidth:</span>
                  <span>{debugData.mainElement.offset.clientWidth}</span>
                  <span className="text-muted-foreground">offsetParent:</span>
                  <span className="truncate">{debugData.mainElement.offset.offsetParent || 'null'}</span>
                </div>
              </div>
            )}

            {/* Overlay Elements */}
            {debugData.overlayElements.length > 0 && (
              <div>
                <div className="font-semibold mb-1 text-destructive">Overlays Detected!</div>
                <div className="space-y-0.5">
                  {debugData.overlayElements.map((el, i) => (
                    <div key={i} className="text-destructive text-[10px] font-mono truncate">
                      {el}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawer Test */}
            {debugData.drawerTest && (
              <div>
                <div className="font-semibold mb-1">Drawer Test</div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Result:</span>
                  <Badge variant={debugData.drawerTest.passed ? 'default' : 'destructive'} className="text-xs">
                    {debugData.drawerTest.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <p className="text-[10px] mt-1 text-muted-foreground">{debugData.drawerTest.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button onClick={runDrawerTest} size="sm" variant="outline" className="w-full">
                <Menu className="h-3 w-3 mr-1" />
                Test Drawer
              </Button>
              <Button onClick={handleCacheReset} size="sm" variant="destructive" className="w-full">
                <Trash2 className="h-3 w-3 mr-1" />
                Reset Cache & Reload
              </Button>
              <Button onClick={copyDebugReport} size="sm" className="w-full">
                <Copy className="h-3 w-3 mr-1" />
                Copy Full Report
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
