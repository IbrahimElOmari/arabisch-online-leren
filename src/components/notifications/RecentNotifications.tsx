import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, Star, Trophy, Gift } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface RecentNotificationsProps {
  maxVisible?: number;
  compact?: boolean;
}

export const RecentNotifications = ({ 
  maxVisible = 5, 
  compact = false 
}: RecentNotificationsProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (message: string) => {
    if (message.includes('badge') || message.includes('Badge')) return Trophy;
    if (message.includes('bonus') || message.includes('punten')) return Gift;
    if (message.includes('beoordeeld')) return Star;
    return MessageCircle;
  };

  const getNotificationVariant = (message: string) => {
    if (message.includes('🎉') || message.includes('badge')) return 'success';
    if (message.includes('🎁') || message.includes('bonus')) return 'warning';
    return 'info';
  };

  const visibleNotifications = notifications.slice(0, maxVisible);

  if (compact) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Meldingen
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {visibleNotifications.length > 0 ? (
            <>
              {visibleNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.message);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      !notification.is_read && "bg-primary/5 border-primary/20",
                      notification.is_read && "bg-muted/30"
                    )}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <IconComponent className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: nl 
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                );
              })}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="w-full mt-2"
                >
                  Alle als gelezen markeren
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Geen nieuwe meldingen
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Recente Meldingen
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </h3>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Alle markeren als gelezen
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {visibleNotifications.length > 0 ? (
          visibleNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.message);
            return (
              <Card
                key={notification.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  !notification.is_read && "border-primary/30 bg-primary/5",
                  notification.is_read && "bg-muted/20"
                )}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      getNotificationVariant(notification.message) === 'success' && "bg-success/10 text-success",
                      getNotificationVariant(notification.message) === 'warning' && "bg-amber-100 dark:bg-amber-950/20 text-amber-600",
                      getNotificationVariant(notification.message) === 'info' && "bg-primary/10 text-primary"
                    )}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: nl 
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nog geen meldingen</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};