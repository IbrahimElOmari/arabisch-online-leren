import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import ForumStructure from '@/components/forum/ForumStructure';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SolvedSubmissionsList } from '@/components/tasks/SolvedSubmissionsList';
import PastLessonsManager from '@/components/lessons/PastLessonsManager';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Navigate } from 'react-router-dom';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EnrolledClass {
  id: string;
  class_id: string;
  payment_status: string;
  klassen: {
    id: string;
    name: string;
    description: string;
  };
}

const Forum = () => {
  const { profile, user, authReady, loading: authLoading, refreshProfile } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classesLoading, setClassesLoading] = useState(true);
  const [showProfileFallback, setShowProfileFallback] = useState(false);
  const [classesTimeout, setClassesTimeout] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Profile fallback timeout - more aggressive
  useEffect(() => {
    if (authReady && user && !profile) {
      console.debug('⏰ Forum: Setting profile fallback timeout (1.5s)');
      const timeout = setTimeout(() => {
        console.debug('🔄 Forum: Profile timeout reached, showing fallback');
        setShowProfileFallback(true);
      }, 1500);

      return () => clearTimeout(timeout);
    } else if (profile) {
      setShowProfileFallback(false);
    }
  }, [authReady, user, profile]);

  // Classes loading timeout
  useEffect(() => {
    if (classesLoading && (profile?.id || showProfileFallback)) {
      console.debug('⏰ Forum: Setting classes timeout (4s)');
      const timeout = setTimeout(() => {
        console.debug('🚨 Forum: Classes loading timeout reached');
        setClassesTimeout(true);
        setClassesLoading(false);
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [classesLoading, profile?.id, showProfileFallback]);

  useEffect(() => {
    // Fetch classes when we have a profile OR when showing profile fallback
    if (profile?.id) {
      console.debug('🏛️ Forum: Profile available, fetching classes for user:', profile.id);
      fetchUserClasses();
    } else if (showProfileFallback && user) {
      console.debug('🏛️ Forum: Using fallback profile, fetching classes for user:', user.id);
      fetchUserClassesWithFallback();
    }
  }, [profile, showProfileFallback, user]);

  const fetchUserClasses = async () => {
    if (!profile?.id) {
      console.debug('⚠️ Forum: fetchUserClasses called without profile.id');
      setClassesLoading(false);
      return;
    }

    try {
      setClassesLoading(true);
      setClassesTimeout(false);
      console.debug('🔄 Forum: Fetching classes for role:', profile.role);

      // 4s hard timeout to prevent hanging queries
      const controller = new AbortController();
      const timer = setTimeout(() => {
        console.warn('⚠️ Forum: Aborting classes fetch after 4s');
        controller.abort();
      }, 4000);

      if (profile?.role === 'admin') {
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal);
        
        clearTimeout(timer);
        if (error) throw error;
        
        const formattedClasses = data?.map(klas => ({
          id: `admin-${klas.id}`,
          class_id: klas.id,
          payment_status: 'paid',
          klassen: {
            id: klas.id,
            name: klas.name,
            description: klas.description || ''
          }
        })) || [];
        
        setEnrolledClasses(formattedClasses);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0].class_id);
        } else {
          setSelectedClass('');
        }
      } else if (profile?.role === 'leerkracht') {
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .eq('teacher_id', profile.id)
          .abortSignal(controller.signal);
        
        clearTimeout(timer);
        if (error) throw error;
        
        const formattedClasses = data?.map(klas => ({
          id: `teacher-${klas.id}`,
          class_id: klas.id,
          payment_status: 'paid',
          klassen: {
            id: klas.id,
            name: klas.name,
            description: klas.description || ''
          }
        })) || [];
        
        setEnrolledClasses(formattedClasses);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0].class_id);
        } else {
          setSelectedClass('');
        }
      } else {
        const { data, error } = await supabase
          .from('inschrijvingen')
          .select(`
            id,
            class_id,
            payment_status,
            klassen:class_id (
              id,
              name,
              description
            )
          `)
          .eq('student_id', profile?.id)
          .eq('payment_status', 'paid')
          .abortSignal(controller.signal);

        clearTimeout(timer);
        if (error) throw error;
        
        setEnrolledClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClass(data[0].class_id);
        } else {
          setSelectedClass('');
        }
      }
    } catch (error) {
      console.error('❌ Forum: Error fetching user classes:', error);
      setEnrolledClasses([]);
      setClassesTimeout(true);
      setSelectedClass('');
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchUserClassesWithFallback = async () => {
    if (!user) return;
    
    try {
      setClassesLoading(true);
      setClassesTimeout(false);
      console.debug('🔄 Forum: Fetching classes with fallback role');
      
      const fallbackRole = user.user_metadata?.role || 'leerling';

      // 4s hard timeout to prevent hanging queries
      const controller = new AbortController();
      const timer = setTimeout(() => {
        console.warn('⚠️ Forum: Aborting fallback classes fetch after 4s');
        controller.abort();
      }, 4000);
      
      if (fallbackRole === 'admin') {
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal);
        
        clearTimeout(timer);
        if (error) throw error;
        
        const formattedClasses = data?.map(klas => ({
          id: `admin-${klas.id}`,
          class_id: klas.id,
          payment_status: 'paid',
          klassen: {
            id: klas.id,
            name: klas.name,
            description: klas.description || ''
          }
        })) || [];
        
        setEnrolledClasses(formattedClasses);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0].class_id);
        } else {
          setSelectedClass('');
        }
      } else if (fallbackRole === 'leerkracht') {
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .eq('teacher_id', user.id)
          .abortSignal(controller.signal);
        
        clearTimeout(timer);
        if (error) throw error;
        
        const formattedClasses = data?.map(klas => ({
          id: `teacher-${klas.id}`,
          class_id: klas.id,
          payment_status: 'paid',
          klassen: {
            id: klas.id,
            name: klas.name,
            description: klas.description || ''
          }
        })) || [];
        
        setEnrolledClasses(formattedClasses);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0].class_id);
        } else {
          setSelectedClass('');
        }
      } else {
        const { data, error } = await supabase
          .from('inschrijvingen')
          .select(`
            id,
            class_id,
            payment_status,
            klassen:class_id (
              id,
              name,
              description
            )
          `)
          .eq('student_id', user.id)
          .eq('payment_status', 'paid')
          .abortSignal(controller.signal);

        clearTimeout(timer);
        if (error) throw error;
        
        setEnrolledClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClass(data[0].class_id);
        } else {
          setSelectedClass('');
        }
      }
    } catch (error) {
      console.error('❌ Forum: Error fetching user classes with fallback:', error);
      setEnrolledClasses([]);
      setClassesTimeout(true);
      setSelectedClass('');
    } finally {
      setClassesLoading(false);
    }
  };

  const handleForceProfile = async () => {
    console.debug('🔄 Forum: Force profile refresh requested');
    setIsRefreshing(true);
    setShowProfileFallback(false);
    
    try {
      await refreshProfile();
    } catch (error) {
      console.error('❌ Forum: Force profile refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auth loading gate
  if (authLoading && !authReady) {
    return <FullPageLoader text="Laden..." />;
  }

  // If auth is ready and there's no user, redirect to auth
  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Profile loading fallback - show earlier
  if (!profile && showProfileFallback) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Card className="main-content-card">
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Forum - Profiel wordt geladen...</h2>
              <p className="text-muted-foreground mb-4">
                Je profiel informatie wordt geladen om toegang te krijgen tot het forum.
              </p>
              <Button 
                onClick={handleForceProfile}
                disabled={isRefreshing}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Bezig...' : 'Forceer profiel'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Still waiting for profile (shorter wait than before)
  if (!profile && !showProfileFallback) {
    return <FullPageLoader text="Profiel laden..." />;
  }

  // Show loading when fetching classes
  if (classesLoading) {
    return <FullPageLoader text="Klassen laden..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {classesTimeout && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verbindingsprobleem</AlertTitle>
            <AlertDescription className="flex items-center gap-3">
              Klassen konden niet tijdig geladen worden. De lijst kan onvolledig zijn.
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (profile?.id) {
                    fetchUserClasses();
                  } else {
                    fetchUserClassesWithFallback();
                  }
                }}
              >
                Opnieuw proberen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="main-content-card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold">Forum</h1>

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

          {enrolledClasses.length > 1 && (
            <div className="max-w-xs mt-4">
              <label className="text-sm font-medium mb-2 block">Selecteer klas:</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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

        {enrolledClasses.length === 0 && (
          <Card className="main-content-card mb-6">
            <CardContent className="py-6">
              <h2 className="text-lg font-semibold mb-2">Geen klassen gevonden</h2>
              <p className="text-muted-foreground mb-4">
                We konden geen klassen ophalen. Je kunt het opnieuw proberen, of vraag je leerkracht/beheerder om je toegang te geven.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  if (profile?.id) {
                    fetchUserClasses();
                  } else {
                    fetchUserClassesWithFallback();
                  }
                }}
              >
                Opnieuw proberen
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="main-content-card">
          <ForumStructure classId={selectedClass || ''} />
        </div>
      </div>
    </div>
  );
};

export default Forum;
