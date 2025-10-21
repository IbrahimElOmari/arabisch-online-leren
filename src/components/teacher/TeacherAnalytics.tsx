import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Download,
  Filter
} from 'lucide-react';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';

interface StudentAnalytics {
  id: string;
  name: string;
  totalPoints: number;
  completedLevels: number;
  averageGrade: number;
  timeSpent: number; // in minutes
  lastActive: string;
  strugglingAreas: string[];
  strengths: string[];
  attendanceRate: number;
}

interface ClassAnalytics {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  completionRate: number;
  averageGrade: number;
  totalHoursSpent: number;
}

interface TeacherAnalyticsProps {
  classId: string;
  teacherId: string;
}

export const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = () => {
  const { themeAge } = useAgeTheme();
  const [selectedView, setSelectedView] = useState<'overview' | 'students' | 'performance'>('overview');

  // Mock data - replace with real Supabase queries
  const classAnalytics: ClassAnalytics = {
    totalStudents: 25,
    activeStudents: 18,
    averageProgress: 68,
    completionRate: 72,
    averageGrade: 7.8,
    totalHoursSpent: 245
  };

  const studentAnalytics: StudentAnalytics[] = [
    {
      id: '1',
      name: 'Sarah Ahmed',
      totalPoints: 2500,
      completedLevels: 3,
      averageGrade: 8.5,
      timeSpent: 120,
      lastActive: '2024-01-15',
      strugglingAreas: ['Grammar'],
      strengths: ['Vocabulary', 'Reading'],
      attendanceRate: 95
    },
    {
      id: '2',
      name: 'Mohammed Ali',
      totalPoints: 1800,
      completedLevels: 2,
      averageGrade: 6.5,
      timeSpent: 85,
      lastActive: '2024-01-14',
      strugglingAreas: ['Pronunciation', 'Writing'],
      strengths: ['Listening'],
      attendanceRate: 78
    },
    {
      id: '3',
      name: 'Fatima Hassan',
      totalPoints: 3200,
      completedLevels: 4,
      averageGrade: 9.2,
      timeSpent: 180,
      lastActive: '2024-01-15',
      strugglingAreas: [],
      strengths: ['Grammar', 'Writing', 'Vocabulary'],
      attendanceRate: 100
    }
  ];

  const getPerformanceColor = (grade: number) => {
    if (grade >= 8) return 'text-success';
    if (grade >= 6) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getThemeClasses = () => {
    switch (themeAge) {
      case 'playful':
        return 'space-y-6';
      case 'professional':
        return 'space-y-4';
      default:
        return 'space-y-6';
    }
  };

  return (
    <div className={cn("p-6", getThemeClasses())}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Klas Analytics</h1>
          <p className="text-muted-foreground">Gedetailleerde inzichten in leerlingprestaties</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 me-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="students">Leerlingen</TabsTrigger>
          <TabsTrigger value="performance">Prestaties</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Key Metrics */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Totaal Leerlingen</p>
                    <p className="text-2xl font-bold">{classAnalytics.totalStudents}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-success">
                    {classAnalytics.activeStudents} actief deze week
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gem. Voortgang</p>
                    <p className="text-2xl font-bold">{classAnalytics.averageProgress}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <Progress value={classAnalytics.averageProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Voltooiingspercentage</p>
                    <p className="text-2xl font-bold">{classAnalytics.completionRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">
                    van toegewezen taken
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gem. Cijfer</p>
                    <p className={cn("text-2xl font-bold", getPerformanceColor(classAnalytics.averageGrade))}>
                      {classAnalytics.averageGrade}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">
                    op 10 punten schaal
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recente Activiteit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div className="flex-1">
                    <p className="font-medium">Sarah Ahmed heeft Level 3 voltooid</p>
                    <p className="text-sm text-muted-foreground">2 uur geleden</p>
                  </div>
                  <Badge variant="outline">Level 3</Badge>
                </div>
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-medium">Mohammed Ali heeft hulp nodig bij Grammar</p>
                    <p className="text-sm text-muted-foreground">4 uur geleden</p>
                  </div>
                  <Badge variant="secondary">Hulp nodig</Badge>
                </div>
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Klassgemiddelde is met 5% gestegen</p>
                    <p className="text-sm text-muted-foreground">1 dag geleden</p>
                  </div>
                  <Badge variant="outline">+5%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <div className="space-y-4">
            {studentAnalytics.map((student) => (
              <Card key={student.id}>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Student Info */}
                    <div>
                      <h3 className="font-semibold text-lg">{student.name}</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {student.totalPoints} punten
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.completedLevels} levels voltooid
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Laatst actief: {new Date(student.lastActive).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>

                    {/* Performance */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Prestaties</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Gemiddeld cijfer</span>
                          <span className={cn("text-sm font-medium", getPerformanceColor(student.averageGrade))}>
                            {student.averageGrade}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Aanwezigheid</span>
                          <span className="text-sm font-medium">{student.attendanceRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Studietijd</span>
                          <span className="text-sm font-medium">{student.timeSpent}min</span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Sterke punten</p>
                      <div className="flex flex-wrap gap-1">
                        {student.strengths.map((strength, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Areas for improvement */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Aandachtspunten</p>
                      <div className="flex flex-wrap gap-1">
                        {student.strugglingAreas.length > 0 ? (
                          student.strugglingAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs text-yellow-600">
                              {area}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs text-success">
                            Geen aandachtspunten
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          {/* Performance charts and detailed analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leervoortgang per Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Grafieken worden hier weergegeven</p>
                    <p className="text-sm">Integratie met grafieken bibliotheek</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cijfer Distributie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">9-10 (Uitstekend)</span>
                    <div className="flex items-center gap-2">
                      <Progress value={20} className="w-24" />
                      <span className="text-sm font-medium">20%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">7-8 (Goed)</span>
                    <div className="flex items-center gap-2">
                      <Progress value={45} className="w-24" />
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">6-7 (Voldoende)</span>
                    <div className="flex items-center gap-2">
                      <Progress value={25} className="w-24" />
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">&lt; 6 (Onvoldoende)</span>
                    <div className="flex items-center gap-2">
                      <Progress value={10} className="w-24" />
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};