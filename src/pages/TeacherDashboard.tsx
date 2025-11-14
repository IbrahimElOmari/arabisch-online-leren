import { useTranslation } from 'react-i18next';
import { useUserRole } from '@/hooks/useUserRole';
import { useTeacherClasses } from '@/hooks/useTeacherClasses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, ClipboardList, Award, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { isTeacher, isAdmin, isLoading: roleLoading } = useUserRole();
  const { classes, isLoading: classesLoading } = useTeacherClasses();

  if (roleLoading || classesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!isTeacher && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('teacher.unauthorized')}</CardTitle>
            <CardDescription>
              {t('teacher.unauthorizedDescription')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalStudents = classes.reduce((sum, cls) => {
    return sum + (cls.inschrijvingen?.[0]?.count || 0);
  }, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">{t('teacher.dashboard.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('teacher.dashboard.subtitle')}
          </p>
        </div>
        <Link to="/teacher/classes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('teacher.newClass')}
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('teacher.stats.totalClasses')}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('teacher.stats.activeClasses')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('teacher.stats.totalStudents')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {t('teacher.stats.enrolledStudents')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('teacher.stats.pendingTasks')}
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              {t('teacher.stats.tasksToGrade')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('teacher.stats.rewardsGiven')}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              {t('teacher.stats.thisMonth')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('teacher.myClasses')}</CardTitle>
          <CardDescription>
            {t('teacher.myClassesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>{t('teacher.noClasses')}</p>
              <Link to="/teacher/classes/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('teacher.createFirstClass')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <Link key={cls.id} to={`/teacher/classes/${cls.id}`}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{cls.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {cls.description || t('teacher.noDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{cls.inschrijvingen?.[0]?.count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{cls.niveaus?.length || 0} {t('teacher.levels')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
