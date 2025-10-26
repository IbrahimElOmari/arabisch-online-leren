import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import type { Locale } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { formatDistanceToNow } from 'date-fns';
import { nl, enUS, ar } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

export const NotificationCenter: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const localeMap = { nl, en: enUS, ar };
  const currentLocale = localeMap[i18n.language as keyof typeof localeMap] || enUS;

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped = (data || []).map(d => ({
        id: d.id,
        type: d.type,
        title: (d.payload as any)?.title || 'Notification',
        message: (d.payload as any)?.message || '',
        read: d.is_read,
        created_at: d.created_at
      }));
      
      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/icon-192.png',
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id || '')
        .eq('is_read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      task_assigned: '✏️',
      task_graded: '✅',
      forum_reply: '💬',
      announcement: '📢',
      lesson_published: '📚',
      badge_earned: '🏆',
      streak_milestone: '🔥',
      system_alert: '⚠️',
    };
    return icons[type] || '🔔';
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.type === activeTab;
  });

  const groupedNotifications = {
    today: filteredNotifications.filter((n) => {
      const diff = Date.now() - new Date(n.created_at).getTime();
      return diff < 24 * 60 * 60 * 1000;
    }),
    thisWeek: filteredNotifications.filter((n) => {
      const diff = Date.now() - new Date(n.created_at).getTime();
      return diff >= 24 * 60 * 60 * 1000 && diff < 7 * 24 * 60 * 60 * 1000;
    }),
    older: filteredNotifications.filter((n) => {
      const diff = Date.now() - new Date(n.created_at).getTime();
      return diff >= 7 * 24 * 60 * 60 * 1000;
    }),
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{t('notifications.title')}</SheetTitle>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  {t('notifications.markAllRead')}
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              {t('notifications.tabs.all')}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              {t('notifications.tabs.unread')}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t('notifications.empty')}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Today */}
                  {groupedNotifications.today.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground px-2">
                        {t('notifications.groups.today')}
                      </h3>
                      {groupedNotifications.today.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          getIcon={getNotificationIcon}
                          locale={currentLocale}
                        />
                      ))}
                    </div>
                  )}

                  {/* This Week */}
                  {groupedNotifications.thisWeek.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground px-2">
                        {t('notifications.groups.thisWeek')}
                      </h3>
                      {groupedNotifications.thisWeek.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          getIcon={getNotificationIcon}
                          locale={currentLocale}
                        />
                      ))}
                    </div>
                  )}

                  {/* Older */}
                  {groupedNotifications.older.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground px-2">
                        {t('notifications.groups.older')}
                      </h3>
                      {groupedNotifications.older.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          getIcon={getNotificationIcon}
                          locale={currentLocale}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  getIcon: (type: string) => string;
  locale: Locale;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  getIcon,
  locale,
}) => {
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        notification.read ? 'bg-background' : 'bg-accent/50'
      } hover:bg-accent`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex gap-3">
        <span className="text-2xl flex-shrink-0">{getIcon(notification.type)}</span>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale,
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
