
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Trophy, 
  Calendar,
  MessageSquare,
  FileText,
  Video
} from 'lucide-react';

interface CourseDetailPageProps {
  courseId: string;
}

export const CourseDetailPage = ({ courseId }: CourseDetailPageProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in real app this would come from props or API
  const course = {
    id: courseId,
    title: 'Arabisch voor Beginners - Niveau 1',
    description: 'Leer de basis van het Arabisch met onze gestructureerde aanpak. Perfect voor absolute beginners.',
    instructor: {
      name: 'Fatima Al-Zahra',
      avatar: '/placeholder.svg',
      bio: 'Ervaren Arabisch docent met meer dan 10 jaar ervaring.'
    },
    price: 299,
    duration: '12 weken',
    lessons: 24,
    students: 156,
    rating: 4.8,
    level: 'Beginner',
    language: 'Nederlands/Arabisch',
    certificate: true,
    preview: '/placeholder-video.mp4'
  };

  const curriculum = [
    {
      week: 1,
      title: 'Arabisch Alfabet',
      lessons: ['Letters herkennen', 'Schrijfrichting', 'Basis uitspraak'],
      duration: '3 uur'
    },
    {
      week: 2,
      title: 'Eerste Woorden',
      lessons: ['Begroetingen', 'Familie woorden', 'Getallen 1-10'],
      duration: '3.5 uur'
    },
    {
      week: 3,
      title: 'Basis Zinnen',
      lessons: ['Zelfintroductie', 'Vragen stellen', 'Ja/Nee antwoorden'],
      duration: '4 uur'
    }
  ];

  const testimonials = [
    {
      name: 'Ahmed Hassan',
      rating: 5,
      comment: 'Uitstekende cursus! De leerkracht legt alles heel duidelijk uit.',
      date: '2 weken geleden'
    },
    {
      name: 'Mariam Saidi',
      rating: 5,
      comment: 'Ik had nooit gedacht dat Arabisch leren zo leuk kon zijn.',
      date: '1 maand geleden'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Badge className="mb-4">{course.level}</Badge>
            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
            <p className="text-muted-foreground text-lg mb-6">{course.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{course.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{course.lessons} lessen</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{course.students} studenten</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{course.rating} ({course.students} reviews)</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={course.instructor.avatar} />
                <AvatarFallback>FA</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{course.instructor.name}</p>
                <p className="text-sm text-muted-foreground">Docent</p>
              </div>
            </div>
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
                  <span className="text-2xl font-bold">€{course.price}</span>
                  <Badge variant="secondary">
                    {course.certificate && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        Certificaat
                      </div>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg">
                  Inschrijven Nu
                </Button>
                <Button variant="outline" className="w-full">
                  Aan Favorieten Toevoegen
                </Button>
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Taal:</span>
                    <span>{course.language}</span>
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
                  {curriculum.length} weken • {course.lessons} lessen • {course.duration} totale duur
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {curriculum.map((week, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Week {week.week}: {week.title}</h3>
                        <Badge variant="outline">{week.duration}</Badge>
                      </div>
                      <div className="space-y-2">
                        {week.lessons.map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="flex items-center gap-2 text-sm">
                            <Video className="h-4 w-4 text-muted-foreground" />
                            <span>{lesson}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructor" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={course.instructor.avatar} />
                    <AvatarFallback>FA</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{course.instructor.name}</CardTitle>
                    <p className="text-muted-foreground">Arabisch Docent</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{course.instructor.bio}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">10+</div>
                    <div className="text-sm text-muted-foreground">Jaar ervaring</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-sm text-muted-foreground">Studenten</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">15</div>
                    <div className="text-sm text-muted-foreground">Cursussen</div>
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
                  <div className="text-3xl font-bold">{course.rating}</div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{course.students} reviews</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{testimonial.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= testimonial.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{testimonial.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{testimonial.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
