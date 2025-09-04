import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { useArabicNumerals } from '@/hooks/useArabicNumerals';

interface TeacherStatsProps {
  totalStudents: number;
  activeClasses: number;
  completedLessons: number;
  totalLessons: number;
  averageEngagement: number;
}

export const TeacherStats = ({ 
  totalStudents, 
  activeClasses, 
  completedLessons, 
  totalLessons, 
  averageEngagement 
}: TeacherStatsProps) => {
  const { t } = useTranslation();
  const { formatNumber, formatPercentage } = useArabicNumerals();
  const progressPercentage = (completedLessons / totalLessons) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('stats.students')}</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatNumber(totalStudents)}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700">
            {t('stats.active')}
          </Badge>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('stats.activeClasses')}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatNumber(activeClasses)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('stats.thisSemester')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('stats.lessonProgress')}</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatNumber(completedLessons)}/{formatNumber(totalLessons)}
              </p>
            </div>
          </div>
          <Progress value={progressPercentage} className="mt-3" />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('stats.engagement')}</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {formatPercentage(averageEngagement)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('stats.average')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};