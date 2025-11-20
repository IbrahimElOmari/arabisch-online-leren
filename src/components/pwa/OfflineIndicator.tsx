/**
 * Offline Indicator Component
 * Shows connection status and sync queue
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSyncStatus, processSyncQueue } from '@/serviceWorker/syncManager';

export function OfflineIndicator() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<{
    pendingTasks: number;
    oldestTask: number | null;
  }>({ pendingTasks: 0, oldestTask: null });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const updateSyncStatus = async () => {
      const status = await getSyncStatus();
      setSyncStatus(status);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update sync status every 10 seconds
    const interval = setInterval(updateSyncStatus, 10000);
    void updateSyncStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await processSyncQueue();
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && syncStatus.pendingTasks === 0) {
    return null; // Don't show indicator when online with no pending tasks
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card border shadow-lg rounded-lg p-4 space-y-2 min-w-[200px]">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('pwa.connection_status')}</span>
          <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                {t('pwa.online')}
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                {t('pwa.offline')}
              </>
            )}
          </Badge>
        </div>

        {/* Sync Status */}
        {syncStatus.pendingTasks > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('pwa.pending_sync')}
              </span>
              <Badge variant="secondary">
                {syncStatus.pendingTasks}
              </Badge>
            </div>

            {isOnline && (
              <Button
                onClick={handleSync}
                disabled={syncing}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {syncing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    {t('pwa.syncing')}
                  </>
                ) : (
                  <>
                    <Cloud className="mr-2 h-3 w-3" />
                    {t('pwa.sync_now')}
                  </>
                )}
              </Button>
            )}

            {!isOnline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CloudOff className="h-3 w-3" />
                {t('pwa.sync_when_online')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
