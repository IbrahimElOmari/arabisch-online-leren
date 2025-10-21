import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  TrendingUp,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useUserRole } from '@/hooks/useUserRole';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  totalStudents: number;
  activeClasses: number;
  completedLevels: number;
  averageScore: number;
  studentEngagement: Array<{ date: string; students: number; completions: number }>;
  classPerformance: Array<{ className: string; averageScore: number; completionRate: number }>;
  levelDistribution: Array<{ level: string; students: number; color: string }>;
  weeklyActivity: Array<{ day: string; tasks: number; quizzes: number; logins: number }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export const EnhancedAnalyticsDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['enhanced-analytics', profile?.id, selectedTimeRange],
    queryFn: async () => await fetchAnalyticsData(),
    enabled: !!profile?.id && (isAdmin || isTeacher),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (!isAdmin && !isTeacher) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          Analytics dashboard is alleen beschikbaar voor beheerders en leerkrachten.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Gedetailleerde inzichten in prestaties en engagement
          </p>
        </div>
        
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <Badge
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range === 'week' ? 'Deze week' : range === 'month' ? 'Deze maand' : 'Dit kwartaal'}
            </Badge>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Totaal Studenten"
          value={analyticsData?.totalStudents || 0}
          icon={<Users className="h-5 w-5" />}
          change="+12%"
          changeType="positive"
        />
        <KPICard
          title="Actieve Klassen"
          value={analyticsData?.activeClasses || 0}
          icon={<BookOpen className="h-5 w-5" />}
          change="+3%"
          changeType="positive"
        />
        <KPICard
          title="Voltooide Niveaus"
          value={analyticsData?.completedLevels || 0}
          icon={<Trophy className="h-5 w-5" />}
          change="+18%"
          changeType="positive"
        />
        <KPICard
          title="Gemiddelde Score"
          value={analyticsData?.averageScore || 0}
          icon={<Target className="h-5 w-5" />}
          suffix="%"
          change="+2%"
          changeType="positive"
        />
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="engagement" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Prestaties</TabsTrigger>
          <TabsTrigger value="distribution">Verdeling</TabsTrigger>
          <TabsTrigger value="activity">Activiteit</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Student Engagement Over Tijd
              </CardTitle>
              <CardDescription>
                Aantal actieve studenten en voltooide opdrachten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData?.studentEngagement || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stackId="1"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.6}
                    name="Actieve Studenten"
                  />
                  <Area
                    type="monotone"
                    dataKey="completions"
                    stackId="1"
                    stroke={COLORS[1]}
                    fill={COLORS[1]}
                    fillOpacity={0.6}
                    name="Voltooiingen"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Prestaties per Klas
              </CardTitle>
              <CardDescription>
                Gemiddelde scores en voltooiingspercentages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData?.classPerformance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="className" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="averageScore"
                    fill={COLORS[0]}
                    name="Gemiddelde Score (%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completionRate"
                    fill={COLORS[1]}
                    name="Voltooiingspercentage (%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Niveau Verdeling
                </CardTitle>
                <CardDescription>
                  Verdeling van studenten over niveaus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData?.levelDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="students"
                      nameKey="level"
                    >
                      {(analyticsData?.levelDistribution || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voortgang Statistieken</CardTitle>
                <CardDescription>
                  Gedetailleerde voortgangsinformatie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gemiddelde Voortgang</span>
                    <span>73%</span>
                  </div>
                  <Progress value={73} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Actieve Deelname</span>
                    <span>86%</span>
                  </div>
                  <Progress value={86} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quiz Succespercentage</span>
                    <span>91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Wekelijkse Activiteit
              </CardTitle>
              <CardDescription>
                Taken, quizzes en logins per dag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData?.weeklyActivity || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    stroke={COLORS[0]}
                    strokeWidth={3}
                    name="Taken"
                    dot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="quizzes"
                    stroke={COLORS[1]}
                    strokeWidth={3}
                    name="Quizzes"
                    dot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="logins"
                    stroke={COLORS[2]}
                    strokeWidth={3}
                    name="Logins"
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  suffix?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  changeType = 'neutral',
  suffix = ''
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-full">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString()}{suffix}
        </div>
        {change && (
          <p className={`text-xs ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {change} van vorige periode
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Analytics data fetching function
const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
  // Mock data - replace with actual Supabase queries
  const mockData: AnalyticsData = {
    totalStudents: 245,
    activeClasses: 12,
    completedLevels: 89,
    averageScore: 76,
    studentEngagement: [
      { date: '2024-01-01', students: 45, completions: 23 },
      { date: '2024-01-02', students: 52, completions: 31 },
      { date: '2024-01-03', students: 38, completions: 19 },
      { date: '2024-01-04', students: 61, completions: 42 },
      { date: '2024-01-05', students: 48, completions: 28 },
      { date: '2024-01-06', students: 33, completions: 15 },
      { date: '2024-01-07', students: 41, completions: 22 },
    ],
    classPerformance: [
      { className: 'Arabisch A1', averageScore: 82, completionRate: 95 },
      { className: 'Arabisch A2', averageScore: 78, completionRate: 87 },
      { className: 'Arabisch B1', averageScore: 74, completionRate: 91 },
      { className: 'Arabisch B2', averageScore: 71, completionRate: 83 },
    ],
    levelDistribution: [
      { level: 'Beginner', students: 95, color: COLORS[0] },
      { level: 'Intermediate', students: 78, color: COLORS[1] },
      { level: 'Advanced', students: 52, color: COLORS[2] },
      { level: 'Expert', students: 20, color: COLORS[3] },
    ],
    weeklyActivity: [
      { day: 'Ma', tasks: 45, quizzes: 32, logins: 128 },
      { day: 'Di', tasks: 52, quizzes: 41, logins: 142 },
      { day: 'Wo', tasks: 38, quizzes: 28, logins: 119 },
      { day: 'Do', tasks: 61, quizzes: 45, logins: 156 },
      { day: 'Vr', tasks: 48, quizzes: 39, logins: 134 },
      { day: 'Za', tasks: 23, quizzes: 15, logins: 87 },
      { day: 'Zo', tasks: 18, quizzes: 12, logins: 64 },
    ],
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockData;
};

export default EnhancedAnalyticsDashboard;