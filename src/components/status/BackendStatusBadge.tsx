
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBackendHealth } from '@/hooks/useBackendHealth';

interface BackendStatusBadgeProps {
  className?: string;
  compact?: boolean;
}

const labelFor = (status: 'ok' | 'degraded' | 'down') => {
  switch (status) {
    case 'ok':
      return 'Backend: Online';
    case 'degraded':
      return 'Backend: Traag';
    case 'down':
      return 'Backend: Probleem';
  }
};

const variantFor = (status: 'ok' | 'degraded' | 'down') => {
  switch (status) {
    case 'ok':
      return 'default' as const;
    case 'degraded':
      return 'secondary' as const;
    case 'down':
      return 'destructive' as const;
  }
};

export const BackendStatusBadge = ({ className, compact = false }: BackendStatusBadgeProps) => {
  const { status, checking, check } = useBackendHealth();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant={variantFor(status)}>
        {labelFor(status)}
      </Badge>
      {!compact && (
        <Button
          size="icon"
          variant="outline"
          onClick={check}
          disabled={checking}
          aria-label="Herlaad backend status"
        >
          <RefreshCw className={cn('h-4 w-4', checking ? 'animate-spin' : '')} />
        </Button>
      )}
    </div>
  );
};

export default BackendStatusBadge;
