import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { adminOpsService } from '@/services/adminOpsService';
import { FEATURE_FLAGS } from '@/config/featureFlags';

export function MaintenanceBanner() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!FEATURE_FLAGS.maintenanceMode && !FEATURE_FLAGS.admin) {
      setLoading(false);
      return;
    }

    const checkMaintenanceMode = async () => {
      try {
        const isEnabled = await adminOpsService.isMaintenanceMode();
        setIsMaintenanceMode(isEnabled);
      } catch (error) {
        console.error('Failed to check maintenance mode:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();

    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceMode, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !isMaintenanceMode) {
    return null;
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-destructive/10 border-destructive/20">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="text-destructive font-medium">
        🚧 De applicatie is momenteel in onderhoudsmodus. Sommige functies zijn mogelijk niet beschikbaar.
      </AlertDescription>
    </Alert>
  );
}