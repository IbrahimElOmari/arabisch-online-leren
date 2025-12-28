/**
 * RTL Debug Panel - DEV-only component for debugging RTL layout issues
 * Enable via URL param: ?rtlDebug=1
 * 
 * STEP 4 PROOF: This panel now includes drawer test functionality
 * that verifies opening/closing the drawer does not affect scrollLeft/scrollWidth
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Copy, RefreshCw, Bug, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DebugData {
  timestamp: string;
  documentDir: string;
  documentLang: string;
  htmlClasses: string;
  containerQuerySupport: boolean;
  noContainerQueriesClass: boolean;
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
    
    let mainData: DebugData['mainElement'] = {
      found: false,
      isVisible: false,
      isWithinViewport: false,
    };
    
    let overlayElements: string[] = [];
    
    if (main) {
      const rect = main.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      const ancestors: NonNullable<DebugData['mainElement']['ancestors']> = [];
      let el: HTMLElement | null = main as HTMLElement;
      for (let i = 0; el && i < 10; i++) {
        const r = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
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
            display: cs.display,
            position: cs.position,
            transform: cs.transform,
            overflowX: cs.overflowX,
            direction: cs.direction,
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

  // STEP 4 PROOF: Test drawer open/close effect on scroll
  const runDrawerTest = useCallback(async () => {
    if (testInProgress.current) return;
    testInProgress.current = true;
    
    const scrollingElement = document.scrollingElement || document.documentElement;
    const beforeScroll = {
      scrollLeft: Math.round(scrollingElement.scrollLeft),
      scrollWidth: Math.round(scrollingElement.scrollWidth),
    };
    
    // Find and click the mobile menu trigger
    const menuButton = document.querySelector('[data-testid="mobile-menu-trigger"]') || 
                       document.querySelector('button[class*="md:hidden"]');
    
    if (menuButton && menuButton instanceof HTMLElement) {
      // Open drawer
      menuButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Log during-open values for debugging (not stored to avoid unused var warning)
      console.log('[RTL Debug] During drawer open - scrollLeft:', scrollingElement.scrollLeft, 'scrollWidth:', scrollingElement.scrollWidth);
      
      // Find and click close button
      const closeButton = document.querySelector('[data-radix-collection-item]') ||
                          document.querySelector('button[class*="SheetClose"]') ||
                          document.querySelector('[role="dialog"] button');
      
      if (closeButton && closeButton instanceof HTMLElement) {
        closeButton.click();
      } else {
        // Click overlay to close
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
    // Check URL param
    const params = new URLSearchParams(window.location.search);
    const shouldShow = params.get('rtlDebug') === '1';
    
    if (shouldShow && import.meta.env.DEV) {
      setIsVisible(true);
      setDebugData(collectDebugData());
    }
  }, [collectDebugData]);

  useEffect(() => {
    if (!isVisible) return;
    
    // Update on resize/scroll
    const handleUpdate = () => {
      setDebugData(collectDebugData());
    };
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    
    // Periodic update
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
    <Card className="fixed bottom-20 right-4 z-[9999] w-80 max-h-[70vh] overflow-auto shadow-xl border-2 border-destructive/50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bug className="h-4 w-4" />
          RTL Debug Panel
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshDebugData}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyDebugReport}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(true)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-xs space-y-3">
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
              </div>
            </div>

            {/* Container Query Support */}
            <div>
              <div className="font-semibold mb-1">Container Queries</div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Support:</span>
                <Badge variant={debugData.containerQuerySupport ? 'default' : 'destructive'} className="text-xs">
                  {debugData.containerQuerySupport ? 'Yes' : 'No'}
                </Badge>
                <span className="text-muted-foreground">Fallback:</span>
                <Badge variant={debugData.noContainerQueriesClass ? 'default' : 'secondary'} className="text-xs">
                  {debugData.noContainerQueriesClass ? 'Active' : 'Inactive'}
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
                <span className="text-muted-foreground">clientWidth:</span>
                <span>{debugData.scroll.clientWidth}</span>
                <span className="text-muted-foreground">Overflow:</span>
                <Badge variant={debugData.scroll.hasHorizontalOverflow ? 'destructive' : 'default'} className="text-xs">
                  {debugData.scroll.hasHorizontalOverflow ? 'Yes!' : 'No'}
                </Badge>
              </div>
            </div>

            {/* Main Element */}
            <div>
              <div className="font-semibold mb-1">Main Element</div>
              {debugData.mainElement.found ? (
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">x:</span>
                  <span className={debugData.mainElement.rect!.x !== 0 ? 'text-warning font-bold' : ''}>
                    {debugData.mainElement.rect!.x}
                  </span>
                  <span className="text-muted-foreground">left:</span>
                  <span>{debugData.mainElement.rect!.left}</span>
                  <span className="text-muted-foreground">right:</span>
                  <span>{debugData.mainElement.rect!.right}</span>
                  <span className="text-muted-foreground">width:</span>
                  <span>{debugData.mainElement.rect!.width}</span>
                  <span className="text-muted-foreground">Visible:</span>
                  <Badge variant={debugData.mainElement.isVisible ? 'default' : 'destructive'} className="text-xs">
                    {debugData.mainElement.isVisible ? 'Yes' : 'NO!'}
                  </Badge>
                </div>
              ) : (
                <Badge variant="destructive">NOT FOUND</Badge>
              )}
            </div>

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

            {/* Drawer Test - STEP 4 PROOF */}
            {debugData.drawerTest && (
              <div>
                <div className="font-semibold mb-1">Drawer Test (Step 4)</div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Result:</span>
                  <Badge variant={debugData.drawerTest.passed ? 'default' : 'destructive'} className="text-xs">
                    {debugData.drawerTest.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                  <span className="text-muted-foreground">Before:</span>
                  <span className="text-[10px]">
                    L:{debugData.drawerTest.beforeScroll.scrollLeft} W:{debugData.drawerTest.beforeScroll.scrollWidth}
                  </span>
                  <span className="text-muted-foreground">After:</span>
                  <span className="text-[10px]">
                    L:{debugData.drawerTest.afterScroll.scrollLeft} W:{debugData.drawerTest.afterScroll.scrollWidth}
                  </span>
                </div>
                <p className="text-[10px] mt-1 text-muted-foreground">{debugData.drawerTest.message}</p>
              </div>
            )}

            {/* Test Drawer Button */}
            <Button onClick={runDrawerTest} size="sm" variant="outline" className="w-full">
              <Menu className="h-3 w-3 mr-1" />
              Test Drawer (Step 4)
            </Button>

            {/* Copy Button */}
            <Button onClick={copyDebugReport} size="sm" className="w-full">
              <Copy className="h-3 w-3 mr-1" />
              Copy Debug Report
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RTLDebugPanel;
