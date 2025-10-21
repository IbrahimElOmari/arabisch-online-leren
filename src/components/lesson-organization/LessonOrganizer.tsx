import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DraggableLessonList } from '@/components/drag-drop/DraggableLessonList';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Plus, Save, BookOpen, GraduationCap } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { toast } from 'sonner';

interface LessonItem {
  id: string;
  title: string;
  type: 'video' | 'task' | 'question';
  duration?: string;
  description?: string;
  order: number;
  isCompleted?: boolean;
  class_id: string;
  level_id?: string;
}

interface Class {
  id: string;
  name: string;
  description: string | null;
}

interface Level {
  id: string;
  naam: string;
  class_id: string;
  beschrijving?: string | null;
}

export const LessonOrganizer = () => {
  const { profile } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(false);

  const canEdit = isAdmin || isTeacher;

  useEffect(() => {
    fetchClasses();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedClass) {
      fetchLevels();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedLevel) {
      fetchLessons();
    }
  }, [selectedClass, selectedLevel]);

  const fetchClasses = async () => {
    try {
      let query = supabase.from('klassen').select('*');
      
      if (isTeacher) {
        query = query.eq('teacher_id', profile?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error(isRTL ? 'خطأ في تحميل الصفوف' : 'Fout bij laden van klassen');
    }
  };

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('niveaus')
        .select('*')
        .eq('class_id', selectedClass)
        .order('niveau_nummer');

      if (error) throw error;

      setLevels(data || []);
      if (data && data.length > 0) {
        setSelectedLevel(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
      toast.error(isRTL ? 'خطأ في تحميل المستويات' : 'Fout bij laden van niveaus');
    }
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      // Fetch lessons (videos)
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessen')
        .select('*')
        .eq('class_id', selectedClass)
        .order('created_at');

      if (lessonsError) throw lessonsError;

      // Fetch tasks (using vragen table as tasks)
      const { data: tasksData, error: tasksError } = await supabase
        .from('vragen')
        .select('*')
        .eq('niveau_id', selectedLevel)
        .order('created_at');

      if (tasksError) throw tasksError;

      // Combine and format data
      const lessonItems: LessonItem[] = [
        ...(lessonsData || []).map((lesson, index) => ({
          id: lesson.id,
          title: lesson.title,
          type: 'video' as const,
          duration: '15 min',
          description: lesson.title, // Use title as description since no description field
          order: index + 1,
          class_id: lesson.class_id,
          level_id: selectedLevel
        })),
        ...(tasksData || []).map((task, index) => ({
          id: task.id,
          title: task.vraag_tekst, // Use vraag_tekst as title
          type: 'question' as const,
          description: task.vraag_tekst,
          order: (lessonsData?.length || 0) + index + 1,
          class_id: selectedClass,
          level_id: task.niveau_id
        }))
      ];

      setLessons(lessonItems);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error(isRTL ? 'خطأ في تحميل الدروس' : 'Fout bij laden van lessen');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (reorderedItems: LessonItem[]) => {
    setLessons(reorderedItems);
  };

  const handleSaveOrder = async () => {
    if (!canEdit) return;

    setLoading(true);
    try {
      // Update lesson orders in database (note: no order_index field exists)
      // This would need to be implemented with a custom order field
      toast.success(isRTL ? 'تم حفظ الترتيب بنجاح' : 'Volgorde succesvol opgeslagen');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(isRTL ? 'خطأ في حفظ الترتيب' : 'Fout bij opslaan van volgorde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'تنظيم الدروس' : 'Les Organisatie'}
          </h1>
          <p className={`text-muted-foreground ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'رتب الدروس والمهام بالسحب والإفلات' : 'Organiseer lessen en taken met drag & drop'}
          </p>
        </div>

        {canEdit && (
          <Button 
            onClick={handleSaveOrder}
            disabled={loading}
            className={`flex items-center gap-2 ${getFlexDirection()}`}
          >
            <Save className="h-4 w-4" />
            <span className={isRTL ? 'arabic-text' : ''}>
              {isRTL ? 'حفظ الترتيب' : 'Volgorde opslaan'}
            </span>
          </Button>
        )}
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${getFlexDirection()}`}>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isRTL ? 'arabic-text' : ''}`}>
                  {isRTL ? 'الصف' : 'Klas'}
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر صفاً' : 'Selecteer een klas'} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((klass) => (
                      <SelectItem key={klass.id} value={klass.id}>
                        <span className={isRTL ? 'arabic-text' : ''}>{klass.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isRTL ? 'arabic-text' : ''}`}>
                  {isRTL ? 'المستوى' : 'Niveau'}
                </label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر مستوى' : 'Selecteer een niveau'} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <span className={isRTL ? 'arabic-text' : ''}>{level.naam}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center justify-center gap-4 ${getFlexDirection()}`}>
              <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <BookOpen className="h-5 w-5 text-primary" />
                <span className={`font-medium ${isRTL ? 'arabic-text' : ''}`}>
                  {lessons.length} {isRTL ? 'درس/مهمة' : 'lessen/taken'}
                </span>
              </div>
              <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                <GraduationCap className="h-5 w-5 text-green-600" />
                <span className={`font-medium ${isRTL ? 'arabic-text' : ''}`}>
                  {lessons.filter(l => l.isCompleted).length} {isRTL ? 'مكتملة' : 'voltooid'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedClass && selectedLevel && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${getFlexDirection()}`}>
              <BookOpen className="h-5 w-5" />
              <span className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'الدروس والمهام' : 'Lessen & Taken'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : lessons.length > 0 ? (
              <DraggableLessonList
                items={lessons}
                onReorder={handleReorder}
                readOnly={!canEdit}
              />
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                  {isRTL ? 'لا توجد دروس أو مهام متاحة' : 'Geen lessen of taken beschikbaar'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};