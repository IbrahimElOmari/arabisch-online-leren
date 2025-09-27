
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useClassesQuery } from '@/hooks/useClassesQuery';
import ForumMain from '@/components/forum/ForumMain';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SolvedSubmissionsList } from '@/components/tasks/SolvedSubmissionsList';
import PastLessonsManager from '@/components/lessons/PastLessonsManager';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { ResponsiveForm } from '@/components/forms/ResponsiveForm';
import { Navigate } from 'react-router-dom';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BackendStatusBadge } from '@/components/status/BackendStatusBadge';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

const Forum = () => {
  const { profile, user, authReady, loading: authLoading, refreshProfile, isRefreshing } = useAuth();
  const { enrolledClasses, isLoading: classesLoading, isError: classesError, refetchClasses, isRefetching } = useClassesQuery(profile, user?.id);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const { getFlexDirection, getTextAlign, getIconSpacing, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  // Set default selected class when classes load
  React.useEffect(() => {
    if (enrolledClasses.length > 0 && !selectedClass) {
      setSelectedClass(enrolledClasses[0].class_id);
    }
  }, [enrolledClasses, selectedClass]);

  // Auth loading gate
  if (authLoading && !authReady) {
    return <FullPageLoader text="Laden..." />;
  }

  // Redirect if no user
  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="@container min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto p-4 sm:p-6">
        <div className={`flex flex-col @md:flex-row @md:items-center @md:justify-between gap-4 mb-6`}>
          <h1 className={`text-xl @md:text-2xl font-bold ${isRTL ? 'arabic-text font-amiri' : ''}`}>{t('forum.title')}</h1>
          <BackendStatusBadge compact />
        </div>

        {/* Profile loading warning */}
        {!profile && user && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className={isRTL ? 'arabic-text' : ''}>{t('profile.loading')}</AlertTitle>
            <AlertDescription className={`${getFlexDirection()} items-center gap-3`}>
              <span className={isRTL ? 'arabic-text' : ''}>{t('profile.loadingDescription')}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshProfile}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${getIconSpacing('1')} ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className={isRTL ? 'arabic-text' : ''}>{isRefreshing ? t('common.loading') : t('profile.forceRefresh')}</span>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Classes error warning */}
        {classesError && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Klassen laden mislukt</AlertTitle>
            <AlertDescription className="flex items-center gap-3">
              Er ging iets mis bij het laden van klassen.
              <Button
                variant="outline"
                size="sm"
                onClick={refetchClasses}
                disabled={isRefetching}
              >
                <RefreshCw className={`h-4 w-4 me-1 ${isRefetching ? 'animate-spin' : ''}`} />
                Opnieuw proberen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="@container mb-6">
          <CardContent className="p-4 @md:p-6 space-y-4 @md:space-y-6">
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3 @md:gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full @sm:w-auto">
                    <span className={isRTL ? 'arabic-text' : ''}>{t('lessons.pastLessons')}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className={isRTL ? 'arabic-text' : ''}>{t('lessons.pastLessons')}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-auto">
                    <PastLessonsManager classId={selectedClass} />
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full @sm:w-auto">
                    <span className={isRTL ? 'arabic-text' : ''}>{t('submissions.myImprovements')}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className={isRTL ? 'arabic-text' : ''}>{t('submissions.improvedAnswers')}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-auto">
                    <SolvedSubmissionsList />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Class selector */}
            {enrolledClasses.length > 1 && (
              <ResponsiveForm layout="single" className="w-full max-w-xs">
                <div className="w-full">
                  <label className={`text-sm font-medium mb-2 block ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
                    {t('classes.selectClass')}:
                  </label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('classes.chooseClass')} />
                    </SelectTrigger>
                    <SelectContent>
                      {enrolledClasses.map((enrollment) => (
                        <SelectItem key={enrollment.id} value={enrollment.class_id}>
                          {enrollment.klassen.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </ResponsiveForm>
            )}
          </CardContent>
        </Card>

        {/* No classes fallback */}
        {enrolledClasses.length === 0 && !classesLoading && (
          <Card className="@container mb-6">
            <CardContent className="py-6">
              <h2 className="text-lg font-semibold mb-2">Geen klassen gevonden</h2>
              <p className="text-muted-foreground mb-4">
                {classesError ? 
                  'We konden geen klassen ophalen vanwege een verbindingsprobleem.' :
                  'Je hebt nog geen toegang tot forum klassen.'
                }
              </p>
              <Button
                variant="outline"
                onClick={refetchClasses}
                disabled={isRefetching}
              >
                <RefreshCw className={`h-4 w-4 me-2 ${isRefetching ? 'animate-spin' : ''}`} />
                Opnieuw proberen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Forum main component */}
        <Card className="@container">
          <CardContent className="p-0">
            <ForumMain classId={selectedClass || ''} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Forum;
