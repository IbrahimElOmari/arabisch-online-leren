import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Trash2, HardDrive, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'image';
  size: number; // in bytes
  url: string;
  isDownloaded: boolean;
  downloadProgress?: number;
  lastAccessed?: Date;
}

interface OfflineStats {
  totalItems: number;
  downloadedItems: number;
  totalSize: number;
  usedSpace: number;
  availableSpace?: number;
}

export const OfflineContentManager = () => {
  const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<OfflineStats>({
    totalItems: 0,
    downloadedItems: 0,
    totalSize: 0,
    usedSpace: 0
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadContentItems();
    loadOfflineStats();
  }, []);

  const loadContentItems = () => {
    // Mock data - in real app, fetch from API/database
    const mockItems: ContentItem[] = [
      {
        id: '1',
        title: 'Arabic Alphabet Lesson 1',
        type: 'video',
        size: 15 * 1024 * 1024, // 15MB
        url: '/content/video1.mp4',
        isDownloaded: false
      },
      {
        id: '2', 
        title: 'Grammar Rules PDF',
        type: 'document',
        size: 2 * 1024 * 1024, // 2MB
        url: '/content/grammar.pdf',
        isDownloaded: true,
        lastAccessed: new Date()
      },
      {
        id: '3',
        title: 'Pronunciation Quiz',
        type: 'quiz',
        size: 512 * 1024, // 512KB
        url: '/content/quiz1.json',
        isDownloaded: false
      },
      {
        id: '4',
        title: 'Arabic Calligraphy Examples',
        type: 'image',
        size: 5 * 1024 * 1024, // 5MB
        url: '/content/calligraphy.zip',
        isDownloaded: true,
        lastAccessed: new Date(Date.now() - 86400000) // 1 day ago
      }
    ];
    
    setContentItems(mockItems);
  };

  const loadOfflineStats = async () => {
    const downloaded = contentItems.filter(item => item.isDownloaded);
    const usedSpace = downloaded.reduce((sum, item) => sum + item.size, 0);
    
    // Estimate available storage
    let availableSpace;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        availableSpace = estimate.quota ? estimate.quota - (estimate.usage || 0) : undefined;
      } catch (error) {
        console.error('Storage estimation failed:', error);
      }
    }
    
    setStats({
      totalItems: contentItems.length,
      downloadedItems: downloaded.length,
      totalSize: contentItems.reduce((sum, item) => sum + item.size, 0),
      usedSpace,
      availableSpace
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadContent = async (item: ContentItem) => {
    if (!isOnline) {
      toast.error(isRTL ? 'لا يوجد اتصال بالإنترنت' : 'Geen internetverbinding');
      return;
    }

    setDownloading(prev => new Set(prev.add(item.id)));
    
    try {
      // Simulate download with progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setContentItems(prev => prev.map(content => 
          content.id === item.id 
            ? { ...content, downloadProgress: progress }
            : content
        ));
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate download time
      }
      
      // Mark as downloaded
      setContentItems(prev => prev.map(content => 
        content.id === item.id 
          ? { ...content, isDownloaded: true, downloadProgress: undefined }
          : content
      ));
      
      toast.success(isRTL ? 'تم التحميل بنجاح' : 'Download voltooid');
    } catch (error) {
      toast.error(isRTL ? 'فشل التحميل' : 'Download mislukt');
      console.error('Download failed:', error);
    } finally {
      setDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
      loadOfflineStats();
    }
  };

  const deleteContent = (item: ContentItem) => {
    setContentItems(prev => prev.map(content => 
      content.id === item.id 
        ? { ...content, isDownloaded: false, lastAccessed: undefined }
        : content
    ));
    
    loadOfflineStats();
    toast.success(isRTL ? 'تم حذف المحتوى' : 'Content verwijderd');
  };

  const downloadAll = async () => {
    const notDownloaded = contentItems.filter(item => !item.isDownloaded);
    for (const item of notDownloaded) {
      await downloadContent(item);
    }
  };

  const clearAllOfflineContent = () => {
    setContentItems(prev => prev.map(content => ({
      ...content,
      isDownloaded: false,
      lastAccessed: undefined
    })));
    
    loadOfflineStats();
    toast.success(isRTL ? 'تم حذف جميع المحتوى المحفوظ' : 'Alle offline content gewist');
  };

  const getItemIcon = (type: string) => {
    const iconMap = {
      video: '🎥',
      document: '📄', 
      quiz: '❓',
      image: '🖼️'
    };
    return iconMap[type as keyof typeof iconMap] || '📄';
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className={`flex items-center justify-between ${getFlexDirection()}`}>
            <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
              {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
              <span className={`font-medium ${isRTL ? 'arabic-text' : ''}`}>
                {isOnline 
                  ? (isRTL ? 'متصل' : 'Online')
                  : (isRTL ? 'غير متصل' : 'Offline')
                }
              </span>
            </div>
            
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline 
                ? (isRTL ? 'يمكن التحميل' : 'Downloads mogelijk')
                : (isRTL ? 'وضع عدم الاتصال' : 'Offline modus')
              }
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Storage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${getFlexDirection()}`}>
            <HardDrive className="h-5 w-5" />
            <span className={isRTL ? 'arabic-text' : ''}>
              {isRTL ? 'إحصائيات التخزين' : 'Opslag Statistieken'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-center`}>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.downloadedItems}</div>
              <div className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'محفوظ' : 'Offline'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <div className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'الإجمالي' : 'Totaal'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatFileSize(stats.usedSpace)}</div>
              <div className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'مستخدم' : 'Gebruikt'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.availableSpace ? formatFileSize(stats.availableSpace) : '?'}
              </div>
              <div className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'متاح' : 'Beschikbaar'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Management */}
      <Tabs defaultValue="content" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content" className={isRTL ? 'arabic-text' : ''}>
            {isRTL ? 'المحتوى' : 'Content'}
          </TabsTrigger>
          <TabsTrigger value="settings" className={isRTL ? 'arabic-text' : ''}>
            {isRTL ? 'الإعدادات' : 'Instellingen'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <div className={`flex items-center justify-between ${getFlexDirection()}`}>
                <CardTitle className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'المحتوى المتاح' : 'Beschikbare Content'}
                </CardTitle>
                
                {isOnline && (
                  <Button 
                    onClick={downloadAll}
                    className={`flex items-center gap-2 ${getFlexDirection()}`}
                  >
                    <Download className="h-4 w-4" />
                    <span className={isRTL ? 'arabic-text' : ''}>
                      {isRTL ? 'تحميل الكل' : 'Alles downloaden'}
                    </span>
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {contentItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className={`flex items-center gap-3 flex-1 min-w-0 ${getFlexDirection()}`}>
                      <div className="text-2xl">{getItemIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
                          {item.title}
                        </h4>
                        <div className={`flex items-center gap-2 text-sm text-muted-foreground ${getFlexDirection()}`}>
                          <span>{formatFileSize(item.size)}</span>
                          {item.isDownloaded && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {isRTL ? 'محفوظ' : 'Offline'}
                            </Badge>
                          )}
                        </div>
                        {item.downloadProgress !== undefined && (
                          <Progress value={item.downloadProgress} className="mt-2" />
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                      {!item.isDownloaded && isOnline && !downloading.has(item.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadContent(item)}
                          className={`flex items-center gap-2 ${getFlexDirection()}`}
                        >
                          <Download className="h-4 w-4" />
                          <span className={isRTL ? 'arabic-text' : ''}>
                            {isRTL ? 'تحميل' : 'Download'}
                          </span>
                        </Button>
                      )}
                      
                      {item.isDownloaded && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteContent(item)}
                          className={`flex items-center gap-2 ${getFlexDirection()}`}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className={isRTL ? 'arabic-text' : ''}>
                            {isRTL ? 'حذف' : 'Verwijderen'}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'إعدادات التخزين' : 'Opslag Instellingen'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="destructive"
                onClick={clearAllOfflineContent}
                className={`flex items-center gap-2 ${getFlexDirection()}`}
              >
                <Trash2 className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'حذف جميع المحتوى المحفوظ' : 'Alle offline content wissen'}
                </span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className={`flex items-center gap-2 ${getFlexDirection()}`}
              >
                <RefreshCw className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'تحديث البيانات' : 'Gegevens vernieuwen'}
                </span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};