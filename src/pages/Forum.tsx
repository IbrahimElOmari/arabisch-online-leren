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
import { RefreshCw } from 'lucide-react';

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

  // Profile fallback timeout
  useEffect(() => {
    if (authReady && user && !profile) {
      console.debug('⏰ Forum: Setting profile fallback timeout (2s)');
      const timeout = setTimeout(() => {
        console.debug('🔄 Forum: Profile timeout reached, showing fallback');
        setShowProfileFallback(true);
      }, 2000);

      return () => clearTimeout(timeout);
    } else {
      setShowProfileFallback(false);
    }
  }, [authReady, user, profile]);

  // Classes loading timeout
  useEffect(() => {
    if (classesLoading && profile?.id) {
      console.debug('⏰ Forum: Setting classes timeout (5s)');
      const timeout = setTimeout(() => {
        console.debug('🚨 Forum: Classes loading timeout reached');
        setClassesTimeout(true);
        setClassesLoading(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [classesLoading, profile?.id]);

  useEffect(() => {
    // Wacht tot profile?.id beschikbaar is voordat we fetchUserClasses aanroepen
    if (profile?.id) {
      console.debug('🏛️ Forum: Profile available, fetching classes for user:', profile.id);
      fetchUserClasses();
    } else if (profile === null) {
      // Profile is expliciet null (geen gebruiker), stop loading
      console.debug('🚫 Forum: No profile available, stopping classesLoading');
      setClassesLoading(false);
    }
    // Als profile undefined is, blijven we wachten (classesLoading = true)
  }, [profile]);

  const fetchUserClasses = async () => {
    // Extra veiligheidscheck
    if (!profile?.id) {
      console.debug('⚠️ Forum: fetchUserClasses called without profile.id');
      setClassesLoading(false);
      return;
    }

    try {
      setClassesLoading(true);
      setClassesTimeout(false);
      console.debug('🔄 Forum: Fetching classes for role:', profile.role);

      if (profile?.role === 'admin') {
        // Admin can see all classes
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .order('created_at', { ascending: false });
        
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
        }
      } else if (profile?.role === 'leerkracht') {
        // Teacher can see assigned classes
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .eq('teacher_id', profile.id);
        
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
        }
      } else {
        // Students see enrolled classes
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
          .eq('payment_status', 'paid');

        if (error) throw error;
        
        setEnrolledClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClass(data[0].class_id);
        }
      }
    } catch (error) {
      console.error('❌ Forum: Error fetching user classes:', error);
      setEnrolledClasses([]);
      setClassesTimeout(true);
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

  // If auth is ready and there's no user, redirect to auth (in case route isn't wrapped)
  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Profile loading fallback
  if (!profile && showProfileFallback) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Card className="main-content-card">
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Profiel wordt geladen...</h2>
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

  // Still waiting for profile to be loaded (normal case)
  if (!profile) {
    return <FullPageLoader text="Profiel laden..." />;
  }

  // Classes timeout error state
  if (classesTimeout) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Card className="main-content-card">
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Kan klassen niet laden</h2>
              <p className="text-muted-foreground mb-4">
                Er ging iets mis bij het laden van je klassen. Probeer het opnieuw.
              </p>
              <Button onClick={fetchUserClasses} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Opnieuw proberen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading when fetching classes
  if (classesLoading) {
    return <FullPageLoader text="Klassen laden..." />;
  }

  if (enrolledClasses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Card className="main-content-card">
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Geen toegang tot forum</h2>
              <p className="text-muted-foreground">
                {profile?.role === 'leerling' 
                  ? 'Je bent nog niet ingeschreven voor een klas.' 
                  : 'Er zijn geen klassen beschikbaar.'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="main-content-card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold">Forum</h1>

            <div className="flex items-center gap-2">
              {/* Voorbije lessen modal */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Voorbije lessen</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Voorbije lessen</DialogTitle>
                  </DialogHeader>
                  {/* PastLessonsManager verwacht doorgaans een classId; we geven de huidige selectie mee */}
                  <div className="max-h-[70vh] overflow-auto">
                    <PastLessonsManager classId={selectedClass} />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Mijn verbeteringen modal */}
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

        <div className="main-content-card">
          <ForumStructure classId={selectedClass || ''} />
        </div>
      </div>
    </div>
  );
};

export default Forum;
