
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Clock, Users, TrendingUp, BookOpen, Target } from 'lucide-react';

interface RecommendedCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  enrollments: number;
  matchScore: number;
  reasons: string[];
  thumbnail?: string;
  price?: number;
}

interface CourseRecommendationsProps {
  recommendations: RecommendedCourse[];
  userProgress: {
    completedCourses: number;
    currentLevel: string;
    interests: string[];
    weakAreas: string[];
  };
  onEnrollCourse: (courseId: string) => void;
}

export const CourseRecommendations = ({ 
  recommendations, 
  userProgress, 
  onEnrollCourse 
}: CourseRecommendationsProps) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatLevel = (level: string) => {
    const levels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Gevorderd'
    };
    return levels[level as keyof typeof levels] || level;
  };

  return (
    <div className="space-y-6">
      {/* User Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Jouw Leertraject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userProgress.completedCourses}</div>
              <p className="text-sm text-muted-foreground">Cursussen Voltooid</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userProgress.currentLevel}</div>
              <p className="text-sm text-muted-foreground">Huidig Niveau</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userProgress.interests.length}</div>
              <p className="text-sm text-muted-foreground">Interessegebieden</p>
            </div>
          </div>
          
          {userProgress.weakAreas.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Aanbevolen Verbetergebieden
              </h4>
              <div className="flex flex-wrap gap-2">
                {userProgress.weakAreas.map((area) => (
                  <Badge key={area} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            AI Cursusaanbevelingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((course) => (
              <Card key={course.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{course.title}</h3>
                        <Badge className={getLevelColor(course.level)}>
                          {formatLevel(course.level)}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {course.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.enrollments.toLocaleString()} leerlingen
                        </span>
                        <span>Door {course.instructor}</span>
                      </div>

                      {/* Match Score */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">AI Match Score</span>
                          <span className="text-primary font-bold">{course.matchScore}%</span>
                        </div>
                        <Progress value={course.matchScore} className="h-2" />
                      </div>

                      {/* Recommendation Reasons */}
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Waarom deze cursus?</h4>
                        <div className="space-y-1">
                          {course.reasons.map((reason, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1 h-1 bg-primary rounded-full" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {course.price && (
                        <div className="mb-2">
                          <span className="text-lg font-bold">€{course.price}</span>
                        </div>
                      )}
                      <Button 
                        onClick={() => onEnrollCourse(course.id)}
                        className="whitespace-nowrap"
                      >
                        Inschrijven
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
