
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProviderRefactored';
import { useClasses } from '@/hooks/useClasses';
import ForumStructure from '@/components/forum/ForumStructure';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SolvedSubmissionsList } from '@/components/tasks/SolvedSubmissionsList';
import PastLessonsManager from '@/components/lessons/PastLessonsManager';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Navigate } from 'react-router-dom';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BackendStatusBadge } from '@/components/status/BackendStatusBadge';

const Forum = () => {
  const { profile, user, authReady, loading: authLoading, refreshProfile } = useAuth();
  const { 
    enrolledClasses, 
    selectedClass, 
    classesLoading, 
    classesError,
    updateSelectedClass,
    refetchClasses 
  } = useClasses(profile, user?.id);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshProfile = async () => {
    console.debug('🔄 Forum: Force profile refresh requested');
    setIsRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.error('❌ Forum: Force profile refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshClasses = async () => {
    console.debug('🔄 Forum: Refresh classes requested');
    await refetchClasses();
  };

  // Auth loading gate
  if (authLoading && !authReady) {
    return <FullPageLoader text="Laden..." />;
  }

  // Redirect if no user
  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show minimal loading only if we have no data at all
  if (!profile && !user && classesLoading && enrolledClasses.length === 0) {
    return <FullPageLoader text="Forum laden..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Forum</h1>
          <BackendStatusBadge compact />
        </div>

        {/* Profile loading warning */}
        {!profile && user && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Profiel wordt geladen</AlertTitle>
            <AlertDescription className="flex items-center gap-3">
              Je profiel informatie wordt nog geladen. Het forum werkt mogelijk met basis functionaliteit.
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshProfile}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Bezig...' : 'Forceer profiel'}
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
              {classesError === 'Timeout' ? 
                'Klassen konden niet tijdig geladen worden.' : 
                'Er ging iets mis bij het laden van klassen.'
              }
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshClasses}
                disabled={classesLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${classesLoading ? 'animate-spin' : ''}`} />
                Opnieuw proberen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="main-content-card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Voorbije lessen</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Voorbije lessen</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-auto">
                    <PastLessonsManager classId={selectedClass} />
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Mijn verbeteringen</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Verbeterde antwoorden en feedback</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-auto">
                    <SolvedSubmissionsList />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Class selector */}
          {enrolledClasses.length > 1 && (
            <div className="max-w-xs mt-4">
              <label className="text-sm font-medium mb-2 block">Selecteer klas:</label>
              <Select value={selectedClass} onValueChange={updateSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies een klas" />
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
          )}
        </div>

        {/* No classes fallback */}
        {enrolledClasses.length === 0 && !classesLoading && (
          <Card className="main-content-card mb-6">
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
                onClick={handleRefreshClasses}
                disabled={classesLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${classesLoading ? 'animate-spin' : ''}`} />
                Opnieuw proberen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Forum structure */}
        <div className="main-content-card">
          <ForumStructure classId={selectedClass || ''} />
        </div>
      </div>
    </div>
  );
};

export default Forum;
