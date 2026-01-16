import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users, BookOpen, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NiveauManagement } from '@/components/teacher/NiveauManagement';
import TaskQuestionManagementNew from '@/components/management/TaskQuestionManagementNew';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClassDetail() {
  const { t } = useTranslation();
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  // Fetch class details
  const { data: klas, isLoading } = useQuery({
    queryKey: ['class-detail', classId],
    queryFn: async () => {
      if (!classId) throw new Error('No class ID');
      const { data, error } = await supabase
        .from('klassen')
        .select(`
          *,
          inschrijvingen(count),
          niveaus(count)
        `)
        .eq('id', classId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!klas) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Klas niet gevonden</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>
      </div>
    );
  }

  const studentCount = Array.isArray(klas.inschrijvingen) 
    ? klas.inschrijvingen[0]?.count || 0 
    : 0;
  const niveauCount = Array.isArray(klas.niveaus) 
    ? klas.niveaus[0]?.count || 0 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{klas.name}</h1>
          {klas.description && (
            <p className="text-muted-foreground">{klas.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('teacher.students', 'Studenten')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('teacher.levels', 'Niveaus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{niveauCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              {t('teacher.createdAt', 'Aangemaakt')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{new Date(klas.created_at).toLocaleDateString('nl-NL')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different management sections */}
      <Tabs defaultValue="niveaus" className="space-y-4">
        <TabsList>
          <TabsTrigger value="niveaus">
            <BookOpen className="h-4 w-4 mr-2" />
            {t('teacher.levels', 'Niveaus')}
          </TabsTrigger>
          <TabsTrigger value="taken">
            <ClipboardList className="h-4 w-4 mr-2" />
            {t('teacher.tasksQuestions', 'Taken & Vragen')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="niveaus">
          <NiveauManagement classId={classId!} className={klas.name} />
        </TabsContent>

        <TabsContent value="taken">
          <TaskQuestionManagementNew />
        </TabsContent>
      </Tabs>
    </div>
  );
}
