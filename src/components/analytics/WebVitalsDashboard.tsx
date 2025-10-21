import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebVitals, WebVital } from '@/utils/webVitals';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const getRatingColor = (rating: WebVital['rating']) => {
  switch (rating) {
    case 'good':
      return 'bg-green-500/10 text-green-700 dark:text-green-400';
    case 'needs-improvement':
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    case 'poor':
      return 'bg-red-500/10 text-red-700 dark:text-red-400';
  }
};

const getRatingIcon = (rating: WebVital['rating']) => {
  switch (rating) {
    case 'good':
      return <TrendingUp className="h-4 w-4" />;
    case 'needs-improvement':
      return <Minus className="h-4 w-4" />;
    case 'poor':
      return <TrendingDown className="h-4 w-4" />;
  }
};

const getMetricDescription = (name: string) => {
  switch (name) {
    case 'LCP':
      return 'Largest Contentful Paint - Main content load time';
    case 'FID':
      return 'First Input Delay - Time to interactive';
    case 'CLS':
      return 'Cumulative Layout Shift - Visual stability';
    case 'FCP':
      return 'First Contentful Paint - Initial render time';
    case 'TTFB':
      return 'Time to First Byte - Server response time';
    case 'INP':
      return 'Interaction to Next Paint - Responsiveness';
    default:
      return 'Performance metric';
  }
};

const formatValue = (name: string, value: number) => {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${value}ms`;
};

export const WebVitalsDashboard = () => {
  const { vitals, getPoorVitals } = useWebVitals();
  const [poorVitals, setPoorVitals] = useState<WebVital[]>([]);

  useEffect(() => {
    setPoorVitals(getPoorVitals());
  }, [vitals, getPoorVitals]);

  if (vitals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Web Vitals
          </CardTitle>
          <CardDescription>
            Performance metrics will appear as you interact with the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No metrics collected yet. Start using the application to see performance data.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Web Vitals Monitor
          </CardTitle>
          <CardDescription>
            Real-time performance metrics for this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vitals.map((vital) => (
              <Card key={vital.name} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {vital.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={getRatingColor(vital.rating)}
                    >
                      <span className="flex items-center gap-1">
                        {getRatingIcon(vital.rating)}
                        {vital.rating}
                      </span>
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {getMetricDescription(vital.name)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(vital.name, vital.value)}
                  </div>
                  {vital.delta !== 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Delta: {formatValue(vital.name, vital.delta)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {poorVitals.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">
              Performance Warnings
            </CardTitle>
            <CardDescription>
              The following metrics are below optimal thresholds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {poorVitals.map((vital) => (
                <div
                  key={vital.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5"
                >
                  <div>
                    <div className="font-medium">{vital.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {getMetricDescription(vital.name)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-destructive">
                      {formatValue(vital.name, vital.value)}
                    </div>
                    <Badge variant="outline" className="mt-1 text-destructive border-destructive/50">
                      Needs attention
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
