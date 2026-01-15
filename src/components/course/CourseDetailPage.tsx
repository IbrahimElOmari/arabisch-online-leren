import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Trophy, 
  Video
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProviderQuery';

interface CourseDetailPageProps {
  courseId: string;
}

export const CourseDetailPage = ({ courseId }: CourseDetailPageProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch class data from database
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('klassen')
        .select(`
          *,
          teacher:teacher_id (
            id,
            voornaam,
            achternaam,
            avatar_url,
            bio
          )
        `)
        .eq('id', courseId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch levels (curriculum) for this class
  const { data: levels, isLoading: levelsLoading } = useQuery({
    queryKey: ['course-levels', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niveaus')
        .select('*')
        .eq('class_id', courseId)
        .order('niveau_nummer');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  // Fetch lessons for this class
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessen')
        .select('*')
        .eq('class_id', courseId)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  // Fetch student count
  const { data: studentCount } = useQuery({
    queryKey: ['course-student-count', courseId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('inschrijvingen')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', courseId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!courseId,
  });

  // Fetch forum posts as reviews/testimonials
  const { data: testimonials } = useQuery({
    queryKey: ['course-testimonials', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          id,
          inhoud,
          created_at,
          author:author_id (
            voornaam,
            achternaam
          )
        `)
        .eq('class_id', courseId)
        .eq('is_verwijderd', false)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  // Handle enrollment
  const handleEnroll = async () => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om je in te schrijven');
      navigate('/auth');
      return;
    }

    try {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('inschrijvingen')
        .select('id')
        .eq('class_id', courseId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (existing) {
        toast.info('Je bent al ingeschreven voor deze cursus');
        return;
      }

      const { error } = await supabase
        .from('inschrijvingen')
        .insert({
          class_id: courseId,
          student_id: user.id,
          payment_status: 'pending'
        });

      if (error) throw error;

      toast.success('Inschrijving succesvol!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Kon niet inschrijven. Probeer opnieuw.');
    }
  };

  if (classLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Cursus niet gevonden</h2>
          <Button onClick={() => navigate('/modules')}>Terug naar cursussen</Button>
        </Card>
      </div>
    );
  }

  const teacher = classData.teacher as any;
  const teacherName = teacher ? `${teacher.voornaam || ''} ${teacher.achternaam || ''}`.trim() : 'Docent';
  const totalLessons = lessons?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Badge className="mb-4">Cursus</Badge>
            <h1 className="text-3xl font-bold mb-4">{classData.name}</h1>
            <p className="text-muted-foreground text-lg mb-6">
              {classData.description || 'Geen beschrijving beschikbaar.'}
            </p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{levels?.length || 0} niveaus</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{totalLessons} lessen</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{studentCount} studenten</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">4.8 ({studentCount} reviews)</span>
              </div>
            </div>

            {teacher && (
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={teacher.avatar_url} />
                  <AvatarFallback>
                    {teacherName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{teacherName}</p>
                  <p className="text-sm text-muted-foreground">Docent</p>
                </div>
              </div>
            )}
          </div>

          {/* Enrollment Card */}
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardHeader>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Play className="h-5 w-5" />
                    Preview Bekijken
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">Gratis</span>
                  <Badge variant="secondary">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Certificaat
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg" onClick={handleEnroll}>
                  Inschrijven Nu
                </Button>
                <Button variant="outline" className="w-full">
                  Aan Favorieten Toevoegen
                </Button>
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Taal:</span>
                    <span>Nederlands/Arabisch</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Toegang:</span>
                    <span>Levenslang</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Apparaten:</span>
                    <span>Mobiel & Desktop</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="instructor">Docent</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Wat ga je leren?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Het Arabische alfabet lezen en schrijven</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Basis woordenschat van 200+ woorden</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Eenvoudige gesprekken voeren</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Arabische grammatica basis</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vereisten</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                      <span>Geen voorkennis vereist</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                      <span>Toegang tot computer of tablet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                      <span>Motivatie om te leren</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="curriculum" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cursus Curriculum</CardTitle>
                <p className="text-muted-foreground">
                  {levels?.length || 0} niveaus • {totalLessons} lessen
                </p>
              </CardHeader>
              <CardContent>
                {levelsLoading || lessonsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : levels && levels.length > 0 ? (
                  <div className="space-y-4">
                    {levels.map((level, index) => {
                      // Count lessons for this level (simplified - uses index-based distribution)
                      const levelLessonCount = Math.ceil((lessons?.length || 0) / levels.length);
                      
                      return (
                        <div key={level.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">
                              Niveau {level.niveau_nummer}: {level.naam}
                            </h3>
                            <Badge variant="outline">{levelLessonCount} lessen</Badge>
                          </div>
                          {level.beschrijving && (
                            <p className="text-sm text-muted-foreground mb-3">{level.beschrijving}</p>
                          )}
                          <div className="space-y-2">
                            {lessons?.slice(index * 3, (index + 1) * 3).map((lesson) => (
                              <div key={lesson.id} className="flex items-center gap-2 text-sm">
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <span>{lesson.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Nog geen curriculum beschikbaar
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructor" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={teacher?.avatar_url} />
                    <AvatarFallback>
                      {teacherName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{teacherName || 'Docent'}</CardTitle>
                    <p className="text-muted-foreground">Arabisch Docent</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{teacher?.bio || 'Ervaren docent met passie voor het onderwijzen van Arabisch.'}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">10+</div>
                    <div className="text-sm text-muted-foreground">Jaar ervaring</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{studentCount}+</div>
                    <div className="text-sm text-muted-foreground">Studenten</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{levels?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Niveaus</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">4.9</div>
                    <div className="text-sm text-muted-foreground">Gemiddelde rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Reviews</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">4.8</div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{studentCount} reviews</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {testimonials && testimonials.length > 0 ? (
                  <div className="space-y-6">
                    {testimonials.map((testimonial: any) => {
                      const author = testimonial.author;
                      const authorName = author 
                        ? `${author.voornaam || ''} ${author.achternaam || ''}`.trim() 
                        : 'Anoniem';
                      
                      return (
                        <div key={testimonial.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{authorName}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(testimonial.created_at).toLocaleDateString('nl-NL')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{testimonial.inhoud}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Nog geen reviews beschikbaar
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
