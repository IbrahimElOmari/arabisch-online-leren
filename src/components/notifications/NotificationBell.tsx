import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { NotificationList } from './NotificationList';
import { NotificationService, type Notification } from '@/services/notificationService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isRTL } = useRTLLayout();
  const queryClient = useQueryClient();

  // Query for unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: NotificationService.getUnreadCount,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    const channel = NotificationService.subscribeToNotifications(
      (notification: Notification) => {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          const { title, description } = NotificationService.getNotificationText(notification);
          new Notification(title, {
            body: description,
            icon: '/favicon.ico',
          });
        }
      },
      (notification: Notification) => {
        // Update read status
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    );

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [queryClient]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative p-2",
            hasUnread && "text-primary",
            className
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {hasUnread ? (
            <BellRing className="h-5 w-5 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 h-5 min-w-5 px-1 text-xs",
                isRTL ? "-left-1" : "-right-1"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          
          <span className="sr-only">
            {hasUnread 
              ? `${unreadCount} nieuwe meldingen` 
              : 'Meldingen'
            }
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align={isRTL ? "start" : "end"}
        className="w-80 p-0"
        sideOffset={8}
      >
        <NotificationList
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}