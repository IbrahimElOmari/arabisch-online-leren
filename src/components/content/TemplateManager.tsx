import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { contentLibraryService } from '@/services/contentLibraryService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ContentTemplate } from '@/types/content';

interface TemplateManagerProps {
  onSelectTemplate?: (template: ContentTemplate) => void;
}

export const TemplateManager = ({ onSelectTemplate }: TemplateManagerProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    template_type: 'prep_lesson',
    template_data: {}
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await contentLibraryService.listTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: t('error', 'Error'),
        description: t('templates.loadFailed', 'Failed to load templates'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.template_name.trim()) {
      toast({
        title: t('error', 'Error'),
        description: t('templates.nameRequired', 'Template name is required'),
        variant: 'destructive'
      });
      return;
    }

    try {
      await contentLibraryService.createTemplate({
        template_name: newTemplate.template_name,
        template_type: newTemplate.template_type,
        template_data: newTemplate.template_data,
        is_public: true
      });

      toast({
        title: t('success', 'Success'),
        description: t('templates.created', 'Template created successfully')
      });

      setNewTemplate({ template_name: '', template_type: 'prep_lesson', template_data: {} });
      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
      toast({
        title: t('error', 'Error'),
        description: t('templates.createFailed', 'Failed to create template'),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await contentLibraryService.deleteTemplate(id);
      toast({
        title: t('success', 'Success'),
        description: t('templates.deleted', 'Template deleted successfully')
      });
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: t('error', 'Error'),
        description: t('templates.deleteFailed', 'Failed to delete template'),
        variant: 'destructive'
      });
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('templates.title', 'Content Templates')}</h2>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('templates.new', 'New Template')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('templates.create', 'Create New Template')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">{t('templates.name', 'Template Name')}</Label>
                <Input
                  id="template-name"
                  value={newTemplate.template_name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, template_name: e.target.value }))}
                  placeholder={t('templates.namePlaceholder', 'Enter template name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-type">{t('templates.type', 'Template Type')}</Label>
                <Select
                  value={newTemplate.template_type}
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, template_type: value }))}
                >
                  <SelectTrigger id="template-type">
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

              <Button onClick={handleCreateTemplate} className="w-full">
                {t('templates.create', 'Create Template')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {template.template_name}
              </CardTitle>
              <CardDescription>
                {t(`content.${template.template_type}`, template.template_type)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate?.(template)}
                  className="flex-1"
                >
                  {t('templates.use', 'Use Template')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('templates.used', 'Used')} {template.usage_count || 0} {t('templates.times', 'times')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('templates.empty', 'No templates yet. Create one to get started!')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
