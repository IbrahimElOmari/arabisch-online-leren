import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Megaphone, Send, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnalyticsTracking } from '@/hooks/useAnalytics';
import { ResponsiveForm, ResponsiveFormField } from '@/components/forms/ResponsiveForm';
import { useUserRole } from '@/hooks/useUserRole';

interface AnnouncementFormData {
  title: string;
  content: string;
  target: 'all' | 'class';
  classId?: string;
  levelIds?: string[];
  priority: 'low' | 'medium' | 'high';
}

const AnnouncementSystem = () => {
  const { profile } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const { trackEvent } = useAnalyticsTracking();
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    target: 'all',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState<Array<{id: string; name: string}>>([]);
  const [levels, setLevels] = useState<Array<{id: string; naam: string; class_id: string}>>([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (formData.classId) {
      fetchLevels();
    }
  }, [formData.classId]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('klassen')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchLevels = async () => {
    if (!formData.classId) return;
    
    try {
      const { data, error } = await supabase
        .from('niveaus')
        .select('id, naam, class_id')
        .eq('class_id', formData.classId)
        .order('niveau_nummer');
      
      if (error) throw error;
      setLevels(data || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !isAdmin) {
      toast({
        title: "Fout",
        description: "Alleen administrators kunnen aankondigingen versturen.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, this would create an announcement in the database
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Track the announcement
      trackEvent('admin_announcement_sent', {
        title: formData.title,
        target: formData.target,
        classId: formData.classId,
        priority: formData.priority,
        contentLength: formData.content.length
      });

      toast({
        title: "Aankondiging Verzonden!",
        description: `De aankondiging "${formData.title}" is succesvol verzonden.`,
      });

      // Reset form
      setFormData({
        title: '',
        content: '',
        target: 'all',
        priority: 'medium'
      });

    } catch (error) {
      console.error('Error sending announcement:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verzenden van de aankondiging.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AnnouncementFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Aankondigingen Versturen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveForm layout="double" onSubmit={handleSubmit}>
          <ResponsiveFormField
            label="Titel"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={(v) => handleInputChange('title', v)}
            placeholder="Aankondiging titel..."
          />

          <div className="space-y-2">
            <Label htmlFor="priority">Prioriteit</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className={getPriorityColor('low')}>Laag</span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className={getPriorityColor('medium')}>Gemiddeld</span>
                </SelectItem>
                <SelectItem value="high">
                  <span className={getPriorityColor('high')}>Hoog</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Doelgroep</Label>
            <Select
              value={formData.target}
              onValueChange={(value) => handleInputChange('target', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Alle gebruikers
                  </div>
                </SelectItem>
                <SelectItem value="class">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Specifieke klas
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.target === 'class' && (
            <>
              <div className="space-y-2 col-span-full @md:col-span-1">
                <Label htmlFor="classId">Selecteer Klas</Label>
                <Select
                  value={formData.classId || ''}
                  onValueChange={(value) => handleInputChange('classId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kies een klas..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((klas) => (
                      <SelectItem key={klas.id} value={klas.id}>
                        {klas.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.classId && levels.length > 0 && (
                <div className="space-y-2 col-span-full">
                  <Label>Selecteer Niveaus (optioneel)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {levels.map((level) => (
                      <div key={level.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={level.id}
                          checked={formData.levelIds?.includes(level.id) || false}
                          onCheckedChange={(checked) => {
                            const newLevelIds = formData.levelIds || [];
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                levelIds: [...newLevelIds, level.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                levelIds: newLevelIds.filter(id => id !== level.id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={level.id} className="text-sm">
                          {level.naam}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <ResponsiveFormField
            label="Bericht"
            name="content"
            type="textarea"
            required
            value={formData.content}
            onChange={(v) => handleInputChange('content', v)}
            placeholder="Typ hier je aankondiging..."
            className="col-span-full"
          />

          <div className="col-span-full flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.content}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Bezig met verzenden...' : 'Verzend Aankondiging'}
            </Button>
          </div>
        </ResponsiveForm>

        {/* Preview */}
        {formData.title && formData.content && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Voorbeeld:</h4>
            <div className="bg-background p-3 rounded border">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium">{formData.title}</h5>
                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(formData.priority)}`}>
                  {formData.priority === 'high' ? 'Hoog' : formData.priority === 'medium' ? 'Gemiddeld' : 'Laag'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {formData.content}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                Doelgroep: {formData.target === 'all' ? 'Alle gebruikers' : 'Specifieke klas'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementSystem;
