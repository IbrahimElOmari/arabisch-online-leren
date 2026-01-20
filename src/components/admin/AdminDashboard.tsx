import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, AlertCircle, Database, Clock, RefreshCw } from 'lucide-react';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export const AdminDashboard = () => {
  const [period, setPeriod] = useState<'1h' | '24h' | '7d'>('24h');
  const { data: metrics, isLoading, error } = useAdminMetrics(period);
  const queryClient = useQueryClient();

  const handleRefreshMetrics = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Metrics</CardTitle>
            <CardDescription>{(error as Error).message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System monitoring and operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefreshMetrics} 
            disabled={isLoading}
            title="Refresh metrics"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Latency</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.api_latency?.current?.toFixed(0) || '0'}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  p95: {metrics?.api_latency?.p95?.toFixed(0) || '0'}ms • 
                  avg: {metrics?.api_latency?.avg?.toFixed(0) || '0'}ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((metrics?.error_rate?.current || 0) * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.error_rate?.total_errors || 0} errors total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DB Connections</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.db_connections?.current || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  max: {metrics?.db_connections?.max || 0} • 
                  avg: {metrics?.db_connections?.avg?.toFixed(1) || '0'}
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.uptime?.formatted || '0h 0m'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.uptime?.seconds?.toFixed(0) || '0'} seconds
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Monitoring period: {period === '1h' ? 'Last Hour' : period === '24h' ? 'Last 24 Hours' : 'Last 7 Days'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Response Time</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics?.api_latency?.trend === 'up' ? '📈 Increasing' : 
                     metrics?.api_latency?.trend === 'down' ? '📉 Decreasing' : 
                     '➡️ Stable'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {(metrics?.error_rate?.current || 0) < 0.01 ? '✅ Healthy' : '⚠️ Elevated'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-sm text-muted-foreground">
                    {(metrics?.db_connections?.current || 0) < (metrics?.db_connections?.max || 100) * 0.8 
                      ? '✅ Normal' 
                      : '⚠️ High Load'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
