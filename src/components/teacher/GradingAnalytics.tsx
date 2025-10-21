import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface GradingStats {
  totalSubmissions: number;
  gradedSubmissions: number;
  avgGrade: number;
  avgGradingTime: number; // in hours
  pendingCount: number;
  studentsWithSubmissions: number;
  classAverage: number;
  gradeDistribution: { grade: string; count: number }[];
}

interface ClassStats {
  className: string;
  totalStudents: number;
  submissionsCount: number;
  averageGrade: number;
  completionRate: number;
}

interface GradingAnalyticsProps {
  classId?: string;
  levelId?: string;
}

export const GradingAnalytics = ({ classId, levelId }: GradingAnalyticsProps) => {
  const [stats, setStats] = useState<GradingStats>({
    totalSubmissions: 0,
    gradedSubmissions: 0,
    avgGrade: 0,
    avgGradingTime: 0,
    pendingCount: 0,
    studentsWithSubmissions: 0,
    classAverage: 0,
    gradeDistribution: []
  });
  
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [classId, levelId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchGradingStats(),
        fetchClassStats()
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGradingStats = async () => {
    let query = supabase
      .from('task_submissions')
      .select(`
        id,
        grade,
        submitted_at,
        student_id,
        tasks!inner(
          grading_scale,
          level_id,
          niveaus!inner(class_id)
        )
      `);

    if (classId) {
      query = query.eq('tasks.niveaus.class_id', classId);
    }

    if (levelId) {
      query = query.eq('tasks.level_id', levelId);
    }

    // Add time range filter
    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'semester':
        startDate.setMonth(now.getMonth() - 6);
        break;
    }
    query = query.gte('submitted_at', startDate.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    if (data) {
      const totalSubmissions = data.length;
      const gradedSubmissions = data.filter(s => s.grade !== null && s.grade !== undefined).length;
      const pendingCount = totalSubmissions - gradedSubmissions;
      
      const grades = data.filter(s => s.grade !== null && s.grade !== undefined).map(s => s.grade ?? 0);
      const avgGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
      
      // Calculate average grading time - simplified to 2 hours as default
      const avgGradingTime = 2; // Default since we don't have updated_at

      const uniqueStudents = new Set(data.map(s => s.student_id)).size;

      // Grade distribution
      const gradeRanges = ['0-5', '5-6', '6-7', '7-8', '8-9', '9-10'];
      const gradeDistribution = gradeRanges.map(range => {
        const [min, max] = range.split('-').map(Number);
        const count = grades.filter(g => g !== null && g !== undefined && g >= min && g < max + 0.1).length;
        return { grade: range, count };
      });

      setStats({
        totalSubmissions,
        gradedSubmissions,
        avgGrade: Math.round(avgGrade * 10) / 10,
        avgGradingTime: avgGradingTime,
        pendingCount,
        studentsWithSubmissions: uniqueStudents,
        classAverage: Math.round(avgGrade * 10) / 10,
        gradeDistribution
      });
    }
  };

  const fetchClassStats = async () => {
    // Fetch class statistics if no specific class is selected
    if (classId) return;

    const { data, error } = await supabase
      .from('klassen')
      .select(`
        id,
        name,
        enrollments:student_enrollments!inner(
          student_id
        ),
        niveaus(
          id,
          tasks(
            id,
            task_submissions(
              id,
              grade,
              student_id
            )
          )
        )
      `);

    if (error) throw error;

    if (data) {
      const classStatsData = data.map(cls => {
        const enrollmentCount = cls.enrollments?.length || 0;
        const allSubmissions = cls.niveaus?.flatMap(n => 
          n.tasks?.flatMap(t => t.task_submissions || []) || []
        ) || [];
        
        const gradedSubmissions = allSubmissions.filter(s => s.grade !== null && s.grade !== undefined);
        const avgGrade = gradedSubmissions.length > 0 ?
          gradedSubmissions.reduce((acc, s) => acc + (s.grade ?? 0), 0) / gradedSubmissions.length : 0;
        
        const uniqueStudentsWithSubmissions = new Set(allSubmissions.map(s => s.student_id)).size;
        const completionRate = enrollmentCount > 0 ? (uniqueStudentsWithSubmissions / enrollmentCount) * 100 : 0;

        return {
          className: cls.name,
          totalStudents: enrollmentCount,
          submissionsCount: allSubmissions.length,
          averageGrade: Math.round(avgGrade * 10) / 10,
          completionRate: Math.round(completionRate)
        };
      });

      setClassStats(classStatsData);
    }
  };

  const getCompletionPercentage = () => {
    return stats.totalSubmissions > 0 ? 
      Math.round((stats.gradedSubmissions / stats.totalSubmissions) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Beoordelings Analytics</h3>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Afgelopen Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Afgelopen Maand
          </Button>
          <Button
            variant={timeRange === 'semester' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('semester')}
          >
            Semester
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Te Beoordelen</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Van {stats.totalSubmissions} totaal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voortgang</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getCompletionPercentage()}%</div>
            <Progress value={getCompletionPercentage()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemiddeld Cijfer</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.avgGrade}</div>
            <p className="text-xs text-muted-foreground">
              {stats.gradedSubmissions} beoordeelde inzendingen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem. Beoordelingstijd</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.avgGradingTime}h
            </div>
            <p className="text-xs text-muted-foreground">
              Vanaf inlevering
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="distribution" className="w-full">
        <TabsList>
          <TabsTrigger value="distribution">Cijferverdeling</TabsTrigger>
          <TabsTrigger value="classes">Klassenoverzicht</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Cijferverdeling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.gradeDistribution.map((item) => (
                  <div key={item.grade} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-12">
                        {item.grade}
                      </Badge>
                      <div className="flex-1">
                        <Progress 
                          value={stats.gradedSubmissions > 0 ? (item.count / stats.gradedSubmissions) * 100 : 0} 
                          className="w-32"
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.count} ({stats.gradedSubmissions > 0 ? 
                        Math.round((item.count / stats.gradedSubmissions) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <div className="grid gap-4">
            {classStats.map((cls) => (
              <Card key={cls.className}>
                <CardHeader>
                  <CardTitle className="text-lg">{cls.className}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Studenten</p>
                      <p className="text-xl font-bold">{cls.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Inzendingen</p>
                      <p className="text-xl font-bold">{cls.submissionsCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gemiddeld Cijfer</p>
                      <p className="text-xl font-bold">{cls.averageGrade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deelname</p>
                      <p className="text-xl font-bold">{cls.completionRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};