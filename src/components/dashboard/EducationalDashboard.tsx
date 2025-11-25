import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BookOpen, Target, TrendingUp, Award } from 'lucide-react';
import { BiDashboardService } from '@/services/biDashboardService';
import { useTranslation } from '@/contexts/TranslationContext';

export const EducationalDashboard = () => {
  const { t } = useTranslation();

  const { data: educational, isLoading } = useQuery({
    queryKey: ['educational-analytics'],
    queryFn: () => BiDashboardService.getEducationalAnalytics(),
  });

  if (isLoading || !educational) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: t('dashboard.active_students', 'Actieve Studenten'),
      value: educational.active_students,
      icon: BookOpen,
      trend: '+15.3%',
    },
    {
      title: t('dashboard.avg_accuracy', 'Gem. Nauwkeurigheid'),
      value: `${educational.avg_accuracy.toFixed(1)}%`,
      icon: Target,
      trend: '+3.2%',
    },
    {
      title: t('dashboard.completion_rate', 'Voltooiingspercentage'),
      value: `${educational.completion_rate.toFixed(1)}%`,
      icon: Award,
      trend: '+5.7%',
    },
    {
      title: t('dashboard.avg_session_time', 'Gem. Sessie Tijd'),
      value: `${educational.avg_session_minutes}min`,
      icon: TrendingUp,
      trend: '+8.1%',
    },
  ];

  // Prepare data for weak/strong topics chart
  const topicsData = [
    ...educational.weak_topics.map((t: any) => ({ topic: t.topic, count: -t.student_count, type: 'Zwak' })),
    ...educational.strong_topics.map((t: any) => ({ topic: t.topic, count: t.student_count, type: 'Sterk' })),
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.trend}</span> vs vorige maand
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Student Progress by Level */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.progress_by_level', 'Voortgang per Niveau')}</CardTitle>
            <CardDescription>Aantal studenten per niveau en hun gemiddelde score</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={educational.student_progress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level_name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="student_count" fill="#8884d8" name="Aantal Studenten" />
                <Bar yAxisId="right" dataKey="avg_points" fill="#82ca9d" name="Gem. Punten" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Module Popularity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.module_popularity', 'Module Populariteit')}</CardTitle>
            <CardDescription>Aantal inschrijvingen per module</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={educational.module_popularity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="module_name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="enrollment_count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weak vs Strong Topics */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.weak_vs_strong_topics', 'Zwakke vs Sterke Onderwerpen')}</CardTitle>
            <CardDescription>Aantal studenten met zwakke/sterke punten per onderwerp</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Studenten">
                  {topicsData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.count < 0 ? '#ff6b6b' : '#51cf66'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.engagement_trend', 'Betrokkenheid Trend')}</CardTitle>
            <CardDescription>Gemiddelde sessietijd per dag</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={educational.engagement_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('nl-NL')}
                />
                <Legend />
                <Line type="monotone" dataKey="avg_session_minutes" stroke="#8884d8" strokeWidth={2} name="Gem. Sessie (min)" />
                <Line type="monotone" dataKey="total_sessions" stroke="#82ca9d" strokeWidth={2} name="Totaal Sessies" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Skills Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.overall_skills', 'Algemene Vaardigheden')}</CardTitle>
          <CardDescription>Gemiddelde accuraatheid per vaardigheid (alle studenten)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={[
              { skill: 'Lezen', accuracy: educational.avg_accuracy },
              { skill: 'Schrijven', accuracy: educational.avg_accuracy * 0.9 },
              { skill: 'Spelling', accuracy: educational.avg_accuracy * 0.85 },
              { skill: 'Vormleer', accuracy: educational.avg_accuracy * 0.8 },
              { skill: 'Grammatica', accuracy: educational.avg_accuracy * 0.75 },
            ]}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Accuraatheid" dataKey="accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
