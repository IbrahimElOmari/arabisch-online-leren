import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { teacherAnalyticsService } from '@/services/teacherAnalyticsService';
import { Loader2, Download, TrendingUp, Users, Award, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface ClassAnalyticsDashboardProps {
  classId: string;
}

export function ClassAnalyticsDashboard({ classId }: ClassAnalyticsDashboardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [classId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, perfData, heatmapData, trendsData] = await Promise.all([
        teacherAnalyticsService.getClassAnalytics(classId),
        teacherAnalyticsService.getStudentPerformance(classId),
        teacherAnalyticsService.getPerformanceHeatmap(classId),
        teacherAnalyticsService.getActivityTrends(classId, 30),
      ]);

      setAnalytics(analyticsData);
      setPerformance(perfData);
      setHeatmap(heatmapData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error(t('teacher.analytics.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await teacherAnalyticsService.exportAnalytics(classId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class-analytics-${classId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('teacher.analytics.export_success'));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('teacher.analytics.export_failed'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('teacher.analytics.total_students')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('teacher.analytics.average_progress')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.averageProgress?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('teacher.analytics.attendance_rate')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.attendanceRate?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('teacher.analytics.badges_earned')}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalBadges || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {t('teacher.analytics.export')}
        </Button>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">{t('teacher.analytics.performance')}</TabsTrigger>
          <TabsTrigger value="heatmap">{t('teacher.analytics.heatmap')}</TabsTrigger>
          <TabsTrigger value="trends">{t('teacher.analytics.trends')}</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('teacher.analytics.student_performance')}</CardTitle>
              <CardDescription>
                {t('teacher.analytics.performance_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="studentName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalPoints" fill="hsl(var(--primary))" name={t('teacher.analytics.points')} />
                  <Bar dataKey="averageProgress" fill="hsl(var(--secondary))" name={t('teacher.analytics.progress')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('teacher.analytics.performance_heatmap')}</CardTitle>
              <CardDescription>
                {t('teacher.analytics.heatmap_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {heatmap.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-8 gap-2">
                    <div className="col-span-2 font-medium text-sm">{row.studentName}</div>
                    {row.weeklyActivity.map((activity: number, dayIdx: number) => (
                      <div
                        key={dayIdx}
                        className="h-12 rounded flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor: `hsl(var(--primary) / ${activity / 100})`,
                          color: activity > 50 ? 'white' : 'inherit',
                        }}
                      >
                        {activity}%
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('teacher.analytics.activity_trends')}</CardTitle>
              <CardDescription>
                {t('teacher.analytics.trends_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" name={t('teacher.analytics.submissions')} />
                  <Line type="monotone" dataKey="attendance" stroke="hsl(var(--secondary))" name={t('teacher.analytics.attendance')} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
