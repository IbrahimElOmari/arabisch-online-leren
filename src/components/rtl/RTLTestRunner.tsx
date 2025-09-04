import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { testRTLCompatibility } from '@/utils/crossBrowserRTL';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  score: number;
}

export const RTLTestRunner = () => {
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  const runRTLTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Browser compatibility tests
    const compatibility = testRTLCompatibility();
    testResults.push({
      name: 'Browser RTL Support',
      status: compatibility.directionSupport ? 'pass' : 'fail',
      details: `Direction support: ${compatibility.directionSupport}`,
      score: compatibility.directionSupport ? 100 : 0
    });

    // Logical properties test
    testResults.push({
      name: 'CSS Logical Properties',
      status: compatibility.logicalProperties ? 'pass' : 'warning',
      details: `Margin-inline support: ${compatibility.logicalProperties}`,
      score: compatibility.logicalProperties ? 100 : 60
    });

    // Text alignment test
    testResults.push({
      name: 'Text Alignment',
      status: compatibility.textAlign ? 'pass' : 'warning',
      details: `Text-align start/end: ${compatibility.textAlign}`,
      score: compatibility.textAlign ? 100 : 70
    });

    // Flexbox direction test
    testResults.push({
      name: 'Flexbox RTL',
      status: compatibility.flexDirection ? 'pass' : 'fail',
      details: `Flex-direction reverse: ${compatibility.flexDirection}`,
      score: compatibility.flexDirection ? 100 : 0
    });

    // Mobile responsiveness test
    const isMobile = window.innerWidth < 768;
    testResults.push({
      name: 'Mobile RTL',
      status: isMobile ? 'pass' : 'warning',
      details: `Mobile viewport: ${window.innerWidth}px`,
      score: isMobile ? 100 : 80
    });

    // Font loading test
    const fontsLoaded = document.fonts.check('16px Amiri') || document.fonts.check('16px "Noto Sans Arabic"');
    testResults.push({
      name: 'Arabic Fonts',
      status: fontsLoaded ? 'pass' : 'warning',
      details: `Arabic fonts loaded: ${fontsLoaded}`,
      score: fontsLoaded ? 100 : 70
    });

    // Accessibility test
    const hasAriaLabels = document.querySelectorAll('[aria-label]').length > 0;
    const hasLangAttribute = document.documentElement.lang !== '';
    testResults.push({
      name: 'RTL Accessibility',
      status: hasAriaLabels && hasLangAttribute ? 'pass' : 'warning',
      details: `ARIA labels: ${hasAriaLabels}, Lang attribute: ${hasLangAttribute}`,
      score: hasAriaLabels && hasLangAttribute ? 100 : 60
    });

    // Performance test
    const performanceEntries = performance.getEntriesByType('navigation');
    const loadTime = performanceEntries[0]?.duration || 0;
    testResults.push({
      name: 'RTL Performance',
      status: loadTime < 3000 ? 'pass' : loadTime < 5000 ? 'warning' : 'fail',
      details: `Load time: ${Math.round(loadTime)}ms`,
      score: loadTime < 3000 ? 100 : loadTime < 5000 ? 70 : 30
    });

    const totalScore = Math.round(testResults.reduce((sum, test) => sum + test.score, 0) / testResults.length);
    
    setResults(testResults);
    setOverallScore(totalScore);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('rtl.testSuite')}
          <Badge variant="outline">{isRTL ? 'RTL' : 'LTR'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runRTLTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? t('rtl.testing') : t('rtl.runTests')}
          </Button>
          
          {results.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall Score:</span>
              <Badge className={overallScore >= 80 ? 'bg-green-100 text-green-800' : 
                              overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}>
                {overallScore}%
              </Badge>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <Progress value={overallScore} className="w-full" />
            
            <div className="grid gap-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-muted-foreground">{result.details}</div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};