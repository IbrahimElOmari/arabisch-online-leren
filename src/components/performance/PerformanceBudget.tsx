import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useWebVitals } from '@/utils/webVitals';

interface BudgetMetric {
  name: string;
  current: number;
  budget: number;
  unit: string;
  status: 'good' | 'warning' | 'exceeded';
}

export const PerformanceBudget: React.FC = () => {
  const { vitals, getPoorVitals } = useWebVitals();
  const [budgetMetrics, setBudgetMetrics] = useState<BudgetMetric[]>([]);
  const [resourceSizes, setResourceSizes] = useState({
    js: 0,
    css: 0,
    images: 0,
    total: 0
  });

  // Performance budgets (in KB)
  const budgets = {
    js: 250,
    css: 100,
    images: 500,
    total: 1000,
    lcp: 2500, // ms
    fcp: 1800, // ms
    cls: 0.1,  // score
    inp: 200   // ms (replaces FID)
  };

  useEffect(() => {
    calculateResourceSizes();
    updateBudgetStatus();
  }, [vitals]);

  const calculateResourceSizes = () => {
    if (!window.performance) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;

    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      
      if (resource.name.includes('.js')) {
        jsSize += size;
      } else if (resource.name.includes('.css')) {
        cssSize += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
        imageSize += size;
      }
    });

    const sizes = {
      js: Math.round(jsSize / 1024), // Convert to KB
      css: Math.round(cssSize / 1024),
      images: Math.round(imageSize / 1024),
      total: Math.round((jsSize + cssSize + imageSize) / 1024)
    };

    setResourceSizes(sizes);
  };

  const updateBudgetStatus = () => {
    const metrics: BudgetMetric[] = [
      {
        name: 'JavaScript',
        current: resourceSizes.js,
        budget: budgets.js,
        unit: 'KB',
        status: getStatus(resourceSizes.js, budgets.js)
      },
      {
        name: 'CSS',
        current: resourceSizes.css,
        budget: budgets.css,
        unit: 'KB',
        status: getStatus(resourceSizes.css, budgets.css)
      },
      {
        name: 'Images',
        current: resourceSizes.images,
        budget: budgets.images,
        unit: 'KB',
        status: getStatus(resourceSizes.images, budgets.images)
      },
      {
        name: 'Total Bundle',
        current: resourceSizes.total,
        budget: budgets.total,
        unit: 'KB',
        status: getStatus(resourceSizes.total, budgets.total)
      }
    ];

    // Add Web Vitals to budget metrics
    vitals.forEach(vital => {
      const budget = budgets[vital.name.toLowerCase() as keyof typeof budgets];
      if (budget && typeof budget === 'number') {
        metrics.push({
          name: vital.name,
          current: vital.value,
          budget,
          unit: vital.name === 'CLS' ? 'score' : 'ms',
          status: vital.rating === 'good' ? 'good' : vital.rating === 'needs-improvement' ? 'warning' : 'exceeded'
        });
      }
    });

    setBudgetMetrics(metrics);
  };

  const getStatus = (current: number, budget: number): 'good' | 'warning' | 'exceeded' => {
    if (current <= budget * 0.8) return 'good';
    if (current <= budget) return 'warning';
    return 'exceeded';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'exceeded': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'exceeded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const exceededBudgets = budgetMetrics.filter(metric => metric.status === 'exceeded');
  const poorVitals = getPoorVitals();

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            📊 Performance Budget
            <Badge variant={exceededBudgets.length > 0 ? 'destructive' : 'secondary'}>
              {exceededBudgets.length === 0 ? 'Within Budget' : `${exceededBudgets.length} Exceeded`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Alerts for exceeded budgets */}
          {exceededBudgets.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {exceededBudgets.length} budget{exceededBudgets.length > 1 ? 's' : ''} exceeded
              </AlertDescription>
            </Alert>
          )}

          {/* Poor Web Vitals */}
          {poorVitals.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Poor Web Vitals: {poorVitals.map(v => v.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Budget metrics */}
          <div className="space-y-2">
            {budgetMetrics.map((metric) => {
              const percentage = Math.min((metric.current / metric.budget) * 100, 100);
              
              return (
                <div key={metric.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1">
                      {getStatusIcon(metric.status)}
                      {metric.name}
                    </span>
                    <span>
                      {metric.current.toFixed(metric.unit === 'score' ? 3 : 0)}/{metric.budget} {metric.unit}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={percentage} className="h-2" />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getStatusColor(metric.status)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            Budgets help maintain fast loading times. Keep bundles small and Core Web Vitals green.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};