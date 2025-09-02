import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { nl, ar } from 'date-fns/locale';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { useRTLAnimations } from '@/hooks/useRTLAnimations';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { getFlexDirection, getTextAlign, isRTL, getRightPosition } = useRTLLayout();
  const { t, language } = useTranslation();
  const { getDropdownClasses, getBounceInClasses } = useRTLAnimations();

  const dateLocale = language === 'ar' ? ar : nl;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          title={t('nav.notifications', 'Notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className={`absolute -top-1 ${getRightPosition('1')} h-5 w-5 ${getFlexDirection()} items-center justify-center p-0 text-xs ${getBounceInClasses()}`}
            >
              <span className={isRTL ? 'arabic-numerals' : ''}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={`w-80 floating-content ${getDropdownClasses()}`} 
        align={isRTL ? "start" : "end"}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className={`${getFlexDirection()} items-center justify-between mb-4`}>
          <h3 className={`font-semibold ${isRTL ? 'arabic-text' : ''}`}>
            {t('nav.notifications', 'Notificaties')}
          </h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <span className={isRTL ? 'arabic-text' : ''}>
                {t('actions.mark_all_read', 'Alles gelezen')}
              </span>
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <p className={`${getTextAlign('center')} text-muted-foreground py-4 ${isRTL ? 'arabic-text' : ''}`}>
              {t('common.no_notifications', 'Geen notificaties')}
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-md border cursor-pointer transition-colors animate-fade-in ${
                    notification.is_read 
                      ? 'bg-muted/30 text-muted-foreground' 
                      : 'bg-background hover:bg-muted/50'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <p className={`text-sm ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
                    {notification.message}
                  </p>
                  <p className={`text-xs text-muted-foreground mt-1 ${getTextAlign('left')} ${isRTL ? 'arabic-numerals' : ''}`}>
                    {formatDistanceToNow(new Date(notification.created_at), { 
                      addSuffix: true, 
                      locale: dateLocale 
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};