
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useTranslation } from '@/contexts/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';

const Taken = () => {
  const { user, authReady, loading: authLoading } = useAuth();
  const { getTextAlign, getFlexDirection } = useRTLLayout();
  const { getNavigationAttributes } = useAccessibilityRTL();
  const { t } = useTranslation();

  // Auth loading gate
  if (authLoading && !authReady) {
    return <FullPageLoader text="Laden..." />;
  }

  // Redirect if no user
  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  const upcomingTasks = [
    { id: 1, title: t('tasks.arabicAlphabet') || 'Arabisch Alfabet Oefening', dueDate: 'Morgen', difficulty: 'Beginner' },
    { id: 2, title: t('tasks.basicVocabulary') || 'Basis Woordenschat Quiz', dueDate: '2 dagen', difficulty: 'Beginner' },
    { id: 3, title: t('tasks.pronunciation') || 'Uitspraak Oefening', dueDate: '1 week', difficulty: 'Gemiddeld' }
  ];

  const completedTasks = [
    { id: 4, title: t('tasks.introduction') || 'Introductie Arabisch', completedDate: 'Gisteren', score: 85 },
    { id: 5, title: t('tasks.basicGreetings') || 'Basis Begroetingen', completedDate: '3 dagen geleden', score: 92 }
  ];

  return (
    <div className="min-h-screen bg-background" {...getNavigationAttributes()}>
      <div className="container mx-auto p-6">
        <h1 className={`text-3xl font-bold mb-8 ${getTextAlign()}`}>
          {t('tasks.title') || 'Taken & Opdrachten'}
        </h1>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${getTextAlign()}`}>
                <Clock className="h-5 w-5 text-primary" />
                {t('tasks.upcoming') || 'Aankomende Taken'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`flex justify-between items-start ${getFlexDirection('row')}`}>
                    <div className="space-y-2">
                      <h3 className={`font-medium ${getTextAlign()}`}>{task.title}</h3>
                      <p className={`text-sm text-muted-foreground ${getTextAlign()}`}>
                        {t('tasks.due') || 'Inleverdatum'}: {task.dueDate}
                      </p>
                      <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                        {task.difficulty}
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      {t('tasks.start') || 'Starten'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${getTextAlign()}`}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                {t('tasks.completed') || 'Afgeronde Taken'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <h3 className={`font-medium ${getTextAlign()}`}>{task.title}</h3>
                    <p className={`text-sm text-muted-foreground ${getTextAlign()}`}>
                      {t('tasks.completedOn') || 'Voltooid op'}: {task.completedDate}
                    </p>
                    <div className={`flex items-center gap-2 ${getFlexDirection('row')}`}>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {t('tasks.score') || 'Score'}: {task.score}%
                      </span>
                      <Button variant="ghost" size="sm">
                        {t('tasks.review') || 'Bekijken'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${getTextAlign()}`}>
              <BookOpen className="h-5 w-5 text-primary" />
              {t('tasks.quickActions') || 'Snelle Acties'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid md:grid-cols-3 gap-4 ${getFlexDirection('row')}`}>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <span className="font-medium">{t('tasks.practiceWriting') || 'Schrijf Oefening'}</span>
                <span className="text-xs text-muted-foreground">{t('tasks.improveHandwriting') || 'Verbeter je handschrift'}</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <span className="font-medium">{t('tasks.vocabularyReview') || 'Woordenschat Herhaling'}</span>
                <span className="text-xs text-muted-foreground">{t('tasks.reviewWords') || 'Herhaal geleerde woorden'}</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <span className="font-medium">{t('tasks.listeningPractice') || 'Luister Oefening'}</span>
                <span className="text-xs text-muted-foreground">{t('tasks.improveListening') || 'Verbeter luistervaardigheid'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Taken;
