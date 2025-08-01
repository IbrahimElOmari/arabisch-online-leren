import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  Award,
  Eye,
  MessageSquare,
  Calendar,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalStudents: number;
  activeClasses: number;
  completedLessons: number;
  averageAttendance: number;
  forumPosts: number;
  weeklyGrowth: number;
  monthlyEngagement: number;
  topPerformingClass: string;
}

interface ClassPerformance {
  className: string;
  studentCount: number;
  averageProgress: number;
  completionRate: number;
  lastActivity: string;
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    fetchAnalytics();
    fetchClassPerformance();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      // Fetch total students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'leerling');

      if (studentsError) throw studentsError;

      // Fetch active classes
      const { data: classesData, error: classesError } = await supabase
        .from('klassen')
        .select('id, name');

      if (classesError) throw classesError;

      // Fetch forum posts
      const { data: forumData, error: forumError } = await supabase
        .from('forum_posts')
        .select('id')
        .eq('is_verwijderd', false);

      if (forumError) throw forumError;

      // Fetch enrollments for completion metrics
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('inschrijvingen')
        .select('id')
        .eq('payment_status', 'paid');

      if (enrollmentsError) throw enrollmentsError;

      // Mock some additional analytics data
      const mockAnalytics: AnalyticsData = {
        totalStudents: studentsData?.length || 0,
        activeClasses: classesData?.length || 0,
        completedLessons: Math.floor((enrollmentsData?.length || 0) * 8.5), // Mock completed lessons
        averageAttendance: 87,
        forumPosts: forumData?.length || 0,
        weeklyGrowth: 12.5,
        monthlyEngagement: 78,
        topPerformingClass: classesData?.[0]?.name || 'N/A'
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassPerformance = async () => {
    try {
      const { data: classesData, error } = await supabase
        .from('klassen')
        .select(`
          id,
          name,
          inschrijvingen (
            id,
            payment_status,
            created_at
          )
        `);

      if (error) throw error;

      const performance: ClassPerformance[] = classesData?.map(klas => ({
        className: klas.name,
        studentCount: klas.inschrijvingen?.filter(i => i.payment_status === 'paid').length || 0,
        averageProgress: Math.floor(Math.random() * 40) + 60, // Mock progress
        completionRate: Math.floor(Math.random() * 30) + 70, // Mock completion rate
        lastActivity: new Date().toLocaleDateString('nl-NL')
      })) || [];

      setClassPerformance(performance);
    } catch (error) {
      console.error('Error fetching class performance:', error);
    }
  };

  const exportReport = () => {
    // Mock export functionality
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      analytics,
      classPerformance
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1 text-sm ${
                dateRange === 'week' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1 text-sm ${
                dateRange === 'month' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              Maand
            </button>
            <button
              onClick={() => setDateRange('quarter')}
              className={`px-3 py-1 text-sm ${
                dateRange === 'quarter' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              Kwartaal
            </button>
          </div>
          <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totale Leerlingen</p>
                <p className="text-2xl font-bold">{analytics?.totalStudents || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">+{analytics?.weeklyGrowth || 0}% deze week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actieve Klassen</p>
                <p className="text-2xl font-bold">{analytics?.activeClasses || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">Alle klassen actief</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Voltooide Lessen</p>
                <p className="text-2xl font-bold">{analytics?.completedLessons || 0}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">Gemiddeld 8.5 per leerling</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gemiddelde Aanwezigheid</p>
                <p className="text-2xl font-bold">{analytics?.averageAttendance || 0}%</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress value={analytics?.averageAttendance || 0} className="h-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Forum Activiteit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Totale Posts</span>
                <Badge variant="secondary">{analytics?.forumPosts || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Maandelijkse Engagement</span>
                <span className="text-sm font-medium">{analytics?.monthlyEngagement || 0}%</span>
              </div>
              <Progress value={analytics?.monthlyEngagement || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Gebruikspatronen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Piekgebruik</span>
                <span className="text-sm font-medium">20:00 - 22:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Populairste Dag</span>
                <span className="text-sm font-medium">Woensdag</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Gemiddelde Sessieduur</span>
                <span className="text-sm font-medium">45 min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Klasprestaties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classPerformance.map((classData, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{classData.className}</h4>
                    <p className="text-sm text-muted-foreground">
                      {classData.studentCount} leerlingen
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{classData.averageProgress}% gemiddelde voortgang</p>
                    <p className="text-xs text-muted-foreground">
                      Laatste activiteit: {classData.lastActivity}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Voortgang</span>
                    <span>{classData.averageProgress}%</span>
                  </div>
                  <Progress value={classData.averageProgress} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span>Voltooiingspercentage</span>
                    <span>{classData.completionRate}%</span>
                  </div>
                  <Progress value={classData.completionRate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;