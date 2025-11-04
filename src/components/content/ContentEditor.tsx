import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichContentEditor } from './RichContentEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContentEditorProps {
  contentId?: string;
  initialContent?: any;
  onSave?: (contentId: string) => void;
}

export const ContentEditor = ({ contentId, initialContent, onSave }: ContentEditorProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState(initialContent?.title || '');
  const [contentType, setContentType] = useState(initialContent?.content_type || 'prep_lesson');
  const [status, setStatus] = useState(initialContent?.status || 'draft');
  const [contentData, setContentData] = useState(initialContent?.content_data || null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleSave = async (publishNow = false) => {
    if (!title.trim()) {
      toast({
        title: t('error', 'Error'),
        description: t('content.titleRequired', 'Title is required'),
        variant: 'destructive'
      });
      return;
    }

    if (!contentData) {
      toast({
        title: t('error', 'Error'),
        description: t('content.contentRequired', 'Content cannot be empty'),
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase.functions.invoke('content-save', {
        body: {
          id: contentId,
          content_type: contentType,
          title,
          content_data: contentData,
          status: publishNow ? 'published' : status
        }
      });

      if (error) throw error;

      toast({
        title: t('success', 'Success'),
        description: publishNow 
          ? t('content.published', 'Content published successfully')
          : t('content.saved', 'Content saved successfully')
      });

      if (onSave && data.content?.id) {
        onSave(data.content.id);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: t('error', 'Error'),
        description: t('content.saveFailed', 'Failed to save content'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!contentId) {
      // Save first, then publish
      await handleSave(true);
      return;
    }

    try {
      setPublishing(true);

      const { error } = await supabase.functions.invoke('content-publish', {
        body: { content_id: contentId }
      });

      if (error) throw error;

      setStatus('published');
      toast({
        title: t('success', 'Success'),
        description: t('content.published', 'Content published successfully')
      });
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: t('error', 'Error'),
        description: t('content.publishFailed', 'Failed to publish content'),
        variant: 'destructive'
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{contentId ? t('content.editTitle', 'Edit Content') : t('content.createTitle', 'Create New Content')}</CardTitle>
        <CardDescription>
          {t('content.description', 'Create rich content with text, images, videos, and more')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">{t('content.title', 'Title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('content.titlePlaceholder', 'Enter content title')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">{t('content.type', 'Content Type')}</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger id="contentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prep_lesson">{t('content.prepLesson', 'Preparation Lesson')}</SelectItem>
                <SelectItem value="live_lesson">{t('content.liveLesson', 'Live Lesson')}</SelectItem>
                <SelectItem value="assignment">{t('content.assignment', 'Assignment')}</SelectItem>
                <SelectItem value="custom">{t('content.custom', 'Custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('content.content', 'Content')}</Label>
          <RichContentEditor
            content={contentData}
            onChange={setContentData}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving || publishing}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('content.saving', 'Saving...')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('content.saveDraft', 'Save Draft')}
              </>
            )}
          </Button>

          <Button
            onClick={handlePublish}
            disabled={saving || publishing}
          >
            {publishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('content.publishing', 'Publishing...')}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t('content.publish', 'Publish')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
