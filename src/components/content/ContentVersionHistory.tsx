import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { contentLibraryService } from '@/services/contentLibraryService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, History, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ContentVersion } from '@/types/content';

interface ContentVersionHistoryProps {
  contentId: string;
  onRestore?: (versionId: string) => void;
}

export const ContentVersionHistory = ({ contentId, onRestore }: ContentVersionHistoryProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [contentId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await contentLibraryService.listVersions(contentId);
      setVersions(data);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast({
        title: t('error', 'Error'),
        description: t('versions.loadFailed', 'Failed to load version history'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    try {
      setRestoring(versionId);
      await contentLibraryService.rollbackToVersion(contentId, versionId);
      
      toast({
        title: t('success', 'Success'),
        description: t('versions.restored', 'Version restored successfully')
      });

      if (onRestore) {
        onRestore(versionId);
      }
      
      loadVersions();
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast({
        title: t('error', 'Error'),
        description: t('versions.restoreFailed', 'Failed to restore version'),
        variant: 'destructive'
      });
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {t('versions.title', 'Version History')}
        </CardTitle>
        <CardDescription>
          {t('versions.description', 'View and restore previous versions of this content')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {versions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('versions.empty', 'No version history available')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <Card key={version.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            {t('versions.version', 'Version')} {version.version_number}
                          </span>
                          {index === 0 && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              {t('versions.current', 'Current')}
                            </span>
                          )}
                          {version.is_published && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                              {t('versions.published', 'Published')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(version.created_at || '').toLocaleString()}
                        </p>
                        {version.change_summary && (
                          <p className="text-sm">{version.change_summary}</p>
                        )}
                      </div>
                      {index !== 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version.id)}
                          disabled={restoring === version.id}
                        >
                          {restoring === version.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('versions.restoring', 'Restoring...')}
                            </>
                          ) : (
                            <>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              {t('versions.restore', 'Restore')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
