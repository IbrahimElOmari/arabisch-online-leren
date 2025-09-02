import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useMobileRTL } from '@/hooks/useMobileRTL';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useTranslation } from '@/contexts/TranslationContext';
import { testRTLCompatibility } from '@/utils/crossBrowserRTL';

export const RTLTestSuite: React.FC = () => {
  const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();
  const { isMobile, getMobileNavClasses } = useMobileRTL();
  const { getAriaLabel, getFocusClasses } = useAccessibilityRTL();
  const { t } = useTranslation();

  const runCompatibilityTest = () => {
    const results = testRTLCompatibility();
    console.log('RTL Compatibility Test Results:', results);
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <CardTitle className={`${getTextAlign('left')} ${isRTL ? 'arabic-text font-amiri' : ''}`}>
            RTL Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Direction Test */}
          <div className={`${getFlexDirection()} items-center gap-4`}>
            <Badge variant={isRTL ? 'default' : 'secondary'}>
              Direction: {isRTL ? 'RTL' : 'LTR'}
            </Badge>
            <Badge variant={isMobile ? 'default' : 'secondary'}>
              Mobile: {isMobile ? 'Yes' : 'No'}
            </Badge>
          </div>

          {/* Text Alignment Test */}
          <div className="space-y-2">
            <p className={getTextAlign('left')}>
              {isRTL ? 'هذا نص عربي للاختبار' : 'This is test text for alignment'}
            </p>
            <p className={getTextAlign('center')}>
              {isRTL ? 'نص في المنتصف' : 'Centered text'}
            </p>
            <p className={getTextAlign('right')}>
              {isRTL ? 'نص على اليسار' : 'Right-aligned text'}
            </p>
          </div>

          {/* Layout Test */}
          <div className={`${getFlexDirection()} gap-4 items-center`}>
            <Button size="sm">First</Button>
            <Button size="sm" variant="outline">Second</Button>
            <Button size="sm" variant="ghost">Third</Button>
          </div>

          {/* Progress Test */}
          <div className="space-y-2">
            <p className={isRTL ? 'arabic-text' : ''}>{t('common.progress')}</p>
            <Progress value={65} className="w-full" />
          </div>

          {/* Skeleton Test */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Mobile Test */}
          <div className={getMobileNavClasses()}>
            <p className={isRTL ? 'arabic-text' : ''}>
              Mobile RTL Classes: {getMobileNavClasses()}
            </p>
          </div>

          {/* Accessibility Test */}
          <Button 
            className={getFocusClasses()}
            aria-label={getAriaLabel('testButton', 'Test button')}
            onClick={runCompatibilityTest}
          >
            {t('test.runCompatibility')}
          </Button>

          {/* Animation Test */}
          <div className="space-y-2">
            <div className="animate-rtl-slide-in p-4 bg-muted rounded">
              RTL Slide Animation
            </div>
            <div className="animate-rtl-pulse p-4 bg-muted rounded">
              RTL Pulse Animation
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};