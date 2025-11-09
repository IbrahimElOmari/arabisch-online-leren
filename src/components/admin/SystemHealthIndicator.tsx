import { Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const SystemHealthIndicator = () => {
  const { overallStatus, healthChecks, isLoading } = useSystemHealth();

  const getStatusIcon = () => {
    if (isLoading) {
      return <Activity className="h-5 w-5 text-muted-foreground animate-pulse" />;
    }

    switch (overallStatus) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (overallStatus) {
      case 'healthy':
        return 'All systems operational';
      case 'degraded':
        return 'Some systems degraded';
      case 'down':
        return 'System issues detected';
      default:
        return 'Checking...';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            {getStatusIcon()}
            <span className="text-sm font-medium hidden md:inline">
              {getStatusText()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">System Health</p>
            {healthChecks.slice(0, 4).map((check) => (
              <div key={check.id} className="flex items-center justify-between text-xs">
                <span className="capitalize">{check.check_type.replace('_', ' ')}</span>
                <span
                  className={
                    check.status === 'healthy'
                      ? 'text-success'
                      : check.status === 'degraded'
                      ? 'text-warning'
                      : 'text-destructive'
                  }
                >
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
