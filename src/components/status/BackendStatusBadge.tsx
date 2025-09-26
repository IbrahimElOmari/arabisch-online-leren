
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useBackendHealthQuery } from '@/hooks/useBackendHealthQuery';

interface BackendStatusBadgeProps {
  compact?: boolean;
}

export const BackendStatusBadge = ({ compact = false }: BackendStatusBadgeProps) => {
  const { data: status, isLoading, refetch, isFetching } = useBackendHealthQuery();

  const getStatusConfig = () => {
    if (isLoading || isFetching) {
      return {
        variant: 'secondary' as const,
        icon: RefreshCw,
        label: 'Controleren...',
        className: 'animate-pulse'
      };
    }

    switch (status) {
      case 'ok':
        return {
          variant: 'default' as const,
          icon: Wifi,
          label: 'Backend Online',
          className: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
        };
      case 'degraded':
        return {
          variant: 'secondary' as const,
          icon: AlertTriangle,
          label: 'Traag',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
        };
      case 'down':
        return {
          variant: 'destructive' as const,
          icon: WifiOff,
          label: 'Offline',
          className: ''
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: AlertTriangle,
          label: 'Onbekend',
          className: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => refetch()}
        className="h-8 px-2"
        disabled={isLoading || isFetching}
      >
        <Icon className={`h-3 w-3 ${isLoading || isFetching ? 'animate-spin' : ''}`} />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={config.variant}
        className={`${config.className} cursor-pointer`}
        onClick={() => refetch()}
      >
        <Icon className={`h-3 w-3 me-1 ${isLoading || isFetching ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    </div>
  );
};
