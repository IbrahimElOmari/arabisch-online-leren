import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { nl, enUS, ar } from 'date-fns/locale';
import { 
  Check, 
  CheckCheck, 
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationService, type Notification } from '@/services/notificationService';
import { NoNotificationsEmptyState } from '@/components/ui/enhanced-empty-states';
import { EnhancedSkeleton } from '@/components/ui/enhanced-loading-states';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from 'react-i18next';

interface NotificationListProps {
  onMarkAllAsRead?: () => void;
  onClose?: () => void;
  showAll?: boolean;
  className?: string;
}

// Get date-fns locale based on current language
const getDateLocale = (lang: string) => {
  switch (lang) {
    case 'ar':
      return ar;
    case 'en':
      return enUS;
    case 'nl':
    default:
      return nl;
  }
};

export function NotificationList({ 
  onMarkAllAsRead, 
  onClose,
  showAll = false,
  className 
}: NotificationListProps) {
  const [page, setPage] = useState(1);
  const { isRTL } = useRTLLayout();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);

  // Query for notifications
  const { 
    data: notificationsData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['notifications', 'list', page, showAll],
    queryFn: () => NotificationService.getNotifications({ 
      page, 
      limit: showAll ? 50 : 10,
      unreadOnly: false 
    }),
    staleTime: 30000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: NotificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (_error) => {
      toast({
        title: t('notifications.error'),
        description: t('notifications.markReadError'),
        variant: "destructive",
      });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const hasMore = notificationsData?.hasMore || false;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    
    const { actionUrl } = NotificationService.getNotificationText(notification);
    if (actionUrl && onClose) {
      onClose();
    }
  };

  const renderNotificationItem = (notification: Notification) => {
    const { title, description, actionUrl } = NotificationService.getNotificationText(notification);
    const icon = NotificationService.getNotificationIcon(notification.type);
    const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
      addSuffix: true, 
      locale: dateLocale 
    });

    const content = (
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
          "hover:bg-accent/50",
          !notification.is_read && "bg-primary/5 border-l-2 border-l-primary"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        {/* Notification icon */}
        <div className="flex-shrink-0 text-lg mt-0.5">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium line-clamp-1",
              !notification.is_read && "font-semibold",
              isRTL && "arabic-text"
            )}>
              {title}
            </h4>
            
            {!notification.is_read && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          
          <p className={cn(
            "text-sm text-muted-foreground line-clamp-2 mt-1",
            isRTL && "arabic-text"
          )}>
            {description}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {timeAgo}
            </span>
            
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {NotificationService.getNotificationIcon(notification.type)} 
              {notification.type}
            </Badge>
          </div>
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"}>
            {!notification.is_read && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  markAsReadMutation.mutate(notification.id);
                }}
              >
                <Check className="h-4 w-4 me-2" />
                {t('notifications.markAsRead')}
              </DropdownMenuItem>
            )}
            {actionUrl && (
              <DropdownMenuItem asChild>
                <Link to={actionUrl} onClick={onClose}>
                  <ExternalLink className="h-4 w-4 me-2" />
                  {t('notifications.viewDetails')}
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );

    // Wrap in Link if there's an action URL
    if (actionUrl) {
      return (
        <Link 
          key={notification.id}
          to={actionUrl}
          onClick={onClose}
          className="block"
        >
          {content}
        </Link>
      );
    }

    return <div key={notification.id}>{content}</div>;
  };

  if (isLoading) {
    return (
      <div className={cn("w-full", className)} dir={isRTL ? 'rtl' : 'ltr'}>
        {!showAll && (
          <div className="flex items-center justify-between p-4 border-b">
            <EnhancedSkeleton className="h-5 w-24" />
            <EnhancedSkeleton className="h-8 w-20" />
          </div>
        )}
        <div className="p-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <EnhancedSkeleton className="h-6 w-6 rounded" />
              <div className="flex-1 space-y-2">
                <EnhancedSkeleton className="h-4 w-3/4" />
                <EnhancedSkeleton className="h-3 w-1/2" />
                <EnhancedSkeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("w-full p-4", className)}>
        <div className={cn("text-center text-destructive", isRTL && "arabic-text")}>
          {t('notifications.loadError')}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <NoNotificationsEmptyState />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      {!showAll && (
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className={cn("font-semibold", isRTL && "arabic-text")}>
            {t('notifications.title')}
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ms-2">
                {unreadCount} {t('notifications.new')}
              </Badge>
            )}
          </h3>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 me-1" />
              {t('notifications.allRead')}
            </Button>
          )}
        </div>
      )}

      {/* Notifications list */}
      <ScrollArea className={cn(showAll ? "h-auto" : "max-h-96")}>
        <div className="p-2 space-y-1">
          {notifications.map(renderNotificationItem)}
        </div>
        
        {/* Load more button */}
        {hasMore && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setPage(prev => prev + 1)}
            >
              {t('notifications.loadMore')}
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* View all link */}
      {!showAll && notifications.length > 0 && (
        <div className="p-4 border-t">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to="/notifications" onClick={onClose}>
              {t('notifications.viewAll')}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
