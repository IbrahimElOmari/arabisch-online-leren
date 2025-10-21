import { useState, useEffect } from 'react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { toast } from 'sonner';

interface NotificationSettings {
  enabled: boolean;
  messages: boolean;
  assignments: boolean;
  announcements: boolean;
  reminders: boolean;
}

interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export const PushNotifications = () => {
  const { isRTL, getFlexDirection } = useRTLLayout();
  
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    messages: true,
    assignments: true,
    announcements: true,
    reminders: false
  });
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  useEffect(() => {
    checkSupport();
    loadSettings();
    loadNotifications();
  }, []);

  const checkSupport = async () => {
    const supported = 
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;
    
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      
      try {
        const reg = await navigator.serviceWorker.ready;
        setRegistration(reg);
      } catch (error) {
        console.error('Service Worker not ready:', error);
      }
    }
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const loadNotifications = () => {
    // Mock notifications - in real app, fetch from backend
    const mockNotifications: PushNotification[] = [
      {
        id: '1',
        title: isRTL ? 'رسالة جديدة' : 'Nieuw bericht',
        body: isRTL ? 'لديك رسالة جديدة من المعلم أحمد' : 'Je hebt een nieuw bericht van leraar Ahmed',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        read: false
      },
      {
        id: '2',
        title: isRTL ? 'مهمة جديدة' : 'Nieuwe opdracht',
        body: isRTL ? 'تم إضافة مهمة جديدة في الصف الأول' : 'Nieuwe opdracht toegevoegd in klas 1',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
        action: {
          label: isRTL ? 'عرض المهمة' : 'Bekijk opdracht',
          url: '/taken'
        }
      },
      {
        id: '3',
        title: isRTL ? 'إعلان مهم' : 'Belangrijke mededeling',
        body: isRTL ? 'سيكون هناك امتحان نهاية الشهر القادم' : 'Er komt een toets aan het einde van volgende maand',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        read: true
      }
    ];
    
    setNotifications(mockNotifications);
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error(isRTL ? 'الإشعارات غير مدعومة' : 'Notificaties niet ondersteund');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPush();
        toast.success(isRTL ? 'تم تفعيل الإشعارات' : 'Notificaties ingeschakeld');
      } else {
        toast.error(isRTL ? 'تم رفض الإشعارات' : 'Notificaties geweigerd');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error(isRTL ? 'خطأ في طلب الإذن' : 'Fout bij aanvragen toestemming');
    }
  };

  const subscribeToPush = async () => {
    if (!registration) return;

    try {
      // In production, you'd use your VAPID public key
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // Replace with actual key
      });
      
      // Send subscription to your backend
      console.log('Push subscription:', subscription);
      
      // Update settings
      const newSettings = { ...settings, enabled: true };
      setSettings(newSettings);
      localStorage.setItem('notification-settings', JSON.stringify(newSettings));
      
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!registration) return;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      
      const newSettings = { ...settings, enabled: false };
      setSettings(newSettings);
      localStorage.setItem('notification-settings', JSON.stringify(newSettings));
      
      toast.success(isRTL ? 'تم إيقاف الإشعارات' : 'Notificaties uitgeschakeld');
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  const updateSettings = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
  };

  const sendTestNotification = () => {
    if (permission !== 'granted') {
      toast.error(isRTL ? 'يجب السماح بالإشعارات أولاً' : 'Sta eerst notificaties toe');
      return;
    }

    const notification = new Notification(
      isRTL ? 'إشعار تجريبي' : 'Test Notificatie',
      {
        body: isRTL ? 'هذا إشعار تجريبي من تطبيق تعلم العربية' : 'Dit is een test notificatie van de Arabic Learning app',
        icon: '/placeholder.svg',
        badge: '/placeholder.svg',
        tag: 'test-notification'
      }
    );

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 5000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) return isRTL ? 'الآن' : 'Nu';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${isRTL ? ' د' : 'm'}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${isRTL ? ' س' : 'u'}`;
    return `${Math.floor(diff / 86400000)}${isRTL ? ' ي' : 'd'}`;
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">{isRTL ? 'مسموح' : 'Toegestaan'}</Badge>;
      case 'denied':
        return <Badge variant="destructive">{isRTL ? 'مرفوض' : 'Geweigerd'}</Badge>;
      default:
        return <Badge variant="outline">{isRTL ? 'في الانتظار' : 'In afwachting'}</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className={`font-semibold mb-2 ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'الإشعارات غير مدعومة' : 'Notificaties niet ondersteund'}
          </h3>
          <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'متصفحك لا يدعم الإشعارات المباشرة' : 'Je browser ondersteunt geen push notificaties'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className={`flex items-center justify-between ${getFlexDirection()}`}>
            <CardTitle className={`flex items-center gap-2 ${getFlexDirection()}`}>
              <Bell className="h-5 w-5" />
              <span className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'إعدادات الإشعارات' : 'Notificatie Instellingen'}
              </span>
            </CardTitle>
            {getPermissionBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between ${getFlexDirection()}`}>
            <div>
              <h4 className={`font-medium ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'تفعيل الإشعارات' : 'Notificaties inschakelen'}
              </h4>
              <p className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'احصل على إشعارات فورية' : 'Ontvang directe meldingen'}
              </p>
            </div>
            
            {permission !== 'granted' ? (
              <Button onClick={requestPermission}>
                {isRTL ? 'السماح بالإشعارات' : 'Sta toe'}
              </Button>
            ) : (
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    subscribeToPush();
                  } else {
                    unsubscribeFromPush();
                  }
                }}
              />
            )}
          </div>

          {settings.enabled && (
            <div className="space-y-3 ps-6 border-s-2 border-border">
              <div className={`flex items-center justify-between ${getFlexDirection()}`}>
                <label className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                  {isRTL ? 'الرسائل الجديدة' : 'Nieuwe berichten'}
                </label>
                <Switch
                  checked={settings.messages}
                  onCheckedChange={(checked) => updateSettings('messages', checked)}
                />
              </div>
              
              <div className={`flex items-center justify-between ${getFlexDirection()}`}>
                <label className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                  {isRTL ? 'المهام الجديدة' : 'Nieuwe opdrachten'}
                </label>
                <Switch
                  checked={settings.assignments}
                  onCheckedChange={(checked) => updateSettings('assignments', checked)}
                />
              </div>
              
              <div className={`flex items-center justify-between ${getFlexDirection()}`}>
                <label className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                  {isRTL ? 'الإعلانات' : 'Mededelingen'}
                </label>
                <Switch
                  checked={settings.announcements}
                  onCheckedChange={(checked) => updateSettings('announcements', checked)}
                />
              </div>
              
              <div className={`flex items-center justify-between ${getFlexDirection()}`}>
                <label className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                  {isRTL ? 'التذكيرات' : 'Herinneringen'}
                </label>
                <Switch
                  checked={settings.reminders}
                  onCheckedChange={(checked) => updateSettings('reminders', checked)}
                />
              </div>
            </div>
          )}

          {permission === 'granted' && (
            <Button
              variant="outline"
              onClick={sendTestNotification}
              className={`w-full flex items-center gap-2 ${getFlexDirection()}`}
            >
              <Settings className="h-4 w-4" />
              <span className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'إرسال إشعار تجريبي' : 'Test notificatie versturen'}
              </span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${getFlexDirection()}`}>
            <Bell className="h-5 w-5" />
            <span className={isRTL ? 'arabic-text' : ''}>
              {isRTL ? 'الإشعارات الحديثة' : 'Recente Notificaties'}
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border transition-colors
                    ${notification.read ? 'bg-muted/50' : 'bg-background border-primary/20'}
                  `}
                >
                  <div className={`
                    h-2 w-2 rounded-full mt-2 flex-shrink-0
                    ${notification.read ? 'bg-muted-foreground' : 'bg-primary'}
                  `} />
                  
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-start justify-between gap-2 ${getFlexDirection()}`}>
                      <div>
                        <h4 className={`font-medium text-sm ${isRTL ? 'arabic-text' : ''}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm text-muted-foreground mt-1 ${isRTL ? 'arabic-text' : ''}`}>
                          {notification.body}
                        </p>
                        {notification.action && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs mt-2"
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                      
                      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${getFlexDirection()}`}>
                        <span>{formatTime(notification.timestamp)}</span>
                        
                        <div className={`flex items-center gap-1 ms-2 ${getFlexDirection()}`}>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'لا توجد إشعارات' : 'Geen notificaties'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};