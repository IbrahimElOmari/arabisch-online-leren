import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchClassById } from '@/services/classService';
import { useClassStudents } from '@/hooks/useTeacherClasses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserPlus, Settings, FileText, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import StudentListCard from '@/components/teacher/StudentListCard';

export default function ClassDetailsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { t } = useTranslation();

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['classDetails', classId],
    queryFn: () => fetchClassById(classId!),
    enabled: !!classId,
  });

  const { students, isLoading: studentsLoading } = useClassStudents(classId);

  if (classLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('teacher.classNotFound')}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/teacher/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-bold">{classData.name}</h1>
          <p className="text-muted-foreground mt-2">
            {classData.description || t('teacher.noDescription')}
          </p>
        </div>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          {t('teacher.settings')}
        </Button>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students">
            {t('teacher.tabs.students')}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            {t('teacher.tabs.tasks')}
          </TabsTrigger>
          <TabsTrigger value="progress">
            {t('teacher.tabs.progress')}
          </TabsTrigger>
          <TabsTrigger value="rewards">
            {t('teacher.tabs.rewards')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              {t('teacher.students')} ({students.length})
            </h2>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('teacher.addStudent')}
            </Button>
          </div>

          {studentsLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <StudentListCard students={students} />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">{t('teacher.tasks')}</h2>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              {t('teacher.createTask')}
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {t('teacher.noTasksYet')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <h2 className="text-2xl font-semibold">{t('teacher.classProgress')}</h2>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {t('teacher.progressDataLoading')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">{t('teacher.rewards')}</h2>
            <Button>
              <Award className="mr-2 h-4 w-4" />
              {t('teacher.awardReward')}
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {t('teacher.noRewardsYet')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
