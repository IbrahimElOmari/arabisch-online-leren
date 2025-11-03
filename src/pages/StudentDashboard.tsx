import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, Video, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Enrollment {
  id: string;
  module_id: string;
  class_id: string | null;
  level_id: string | null;
  status: string | null;
}

interface PrepLesson {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  sequence_order: number;
}

interface LiveLesson {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  duration_minutes: number;
  join_link: string | null;
  recording_link: string | null;
}

const StudentDashboard = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [prepLessons, setPrepLessons] = useState<PrepLesson[]>([]);
  const [liveLessons, setLiveLessons] = useState<LiveLesson[]>([]);
  const [onWaitingList, setOnWaitingList] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get active enrollment
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('status', 'active')
        .order('activated_at', { ascending: false })
        .limit(1);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        // Check for waiting list
        const { data: waiting } = await supabase
          .from('waiting_list')
          .select('*')
          .limit(1);
        
        if (waiting && waiting.length > 0) {
          setOnWaitingList(true);
        }
        return;
      }

      const activeEnrollment = enrollments[0];
      setEnrollment(activeEnrollment);

      // Load prep lessons
      if (activeEnrollment.level_id) {
        const { data: prepData } = await supabase.functions.invoke('lessons-prep', {
          body: {
            module_id: activeEnrollment.module_id,
            level_id: activeEnrollment.level_id
          }
        });
        
        if (prepData?.lessons) {
          setPrepLessons(prepData.lessons);
        }
      }

      // Load live lessons
      if (activeEnrollment.class_id) {
        const { data: liveData } = await supabase.functions.invoke('lessons-live', {
          body: {
            module_id: activeEnrollment.module_id,
            class_id: activeEnrollment.class_id
          }
        });
        
        if (liveData?.lessons) {
          setLiveLessons(liveData.lessons);
        }
      }

    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast({
        title: t('error', 'Error'),
        description: t('dashboard.loadFailed', 'Failed to load dashboard'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (onWaitingList) {
    return (
      <div className="container mx-auto py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('dashboard.waiting', 'You are on the waiting list. We will notify you when a spot becomes available.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.noEnrollment', 'No Active Enrollment')}</CardTitle>
            <CardDescription>
              {t('dashboard.noEnrollmentDesc', 'You are not currently enrolled in any modules')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/modules'}>
              {t('dashboard.browse', 'Browse Modules')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">{t('dashboard.title', 'My Dashboard')}</h1>

      <Tabs defaultValue="prep" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prep">
            <BookOpen className="h-4 w-4 mr-2" />
            {t('dashboard.prep', 'Preparation')}
          </TabsTrigger>
          <TabsTrigger value="live">
            <Video className="h-4 w-4 mr-2" />
            {t('dashboard.live', 'Live Lessons')}
          </TabsTrigger>
          <TabsTrigger value="forum">
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('dashboard.forum', 'Forum')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prep" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.prepLessons', 'Preparatory Lessons')}</CardTitle>
              <CardDescription>
                {t('dashboard.prepDesc', 'Self-study materials to prepare for live sessions')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prepLessons.length === 0 ? (
                <p className="text-muted-foreground">
                  {t('dashboard.noPrep', 'No preparatory lessons available yet')}
                </p>
              ) : (
                <div className="space-y-3">
                  {prepLessons.map((lesson) => (
                    <Card key={lesson.id} className="cursor-pointer hover:bg-secondary/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{lesson.title}</h3>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          {lesson.duration_minutes && (
                            <div className="flex items-center text-sm text-muted-foreground ml-4">
                              <Clock className="h-4 w-4 mr-1" />
                              {lesson.duration_minutes} min
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.liveLessons', 'Live Lessons')}</CardTitle>
              <CardDescription>
                {t('dashboard.liveDesc', 'Scheduled live sessions and recordings')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liveLessons.length === 0 ? (
                <p className="text-muted-foreground">
                  {t('dashboard.noLive', 'No live lessons scheduled yet')}
                </p>
              ) : (
                <div className="space-y-3">
                  {liveLessons.map((lesson) => (
                    <Card key={lesson.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold">{lesson.title}</h3>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {format(new Date(lesson.starts_at), 'PPP p')}
                            </div>
                            <span>{lesson.duration_minutes} min</span>
                          </div>
                          <div className="flex gap-2">
                            {lesson.join_link && (
                              <Button size="sm" asChild>
                                <a href={lesson.join_link} target="_blank" rel="noopener noreferrer">
                                  {t('dashboard.join', 'Join Session')}
                                </a>
                              </Button>
                            )}
                            {lesson.recording_link && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={lesson.recording_link} target="_blank" rel="noopener noreferrer">
                                  {t('dashboard.recording', 'Watch Recording')}
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forum">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.forumTitle', 'Class Forum')}</CardTitle>
              <CardDescription>
                {t('dashboard.forumDesc', 'Discuss with your classmates and teachers')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('dashboard.forumComing', 'Forum feature coming soon. You will be able to chat with your class here.')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
