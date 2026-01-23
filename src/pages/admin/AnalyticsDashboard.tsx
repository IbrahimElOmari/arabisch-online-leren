import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BiDashboardService } from '@/services/biDashboardService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, DollarSign, GraduationCap, Filter, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FunnelChart } from '@/components/analytics/FunnelChart';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [activeTab, setActiveTab] = useState<'educational' | 'financial' | 'funnel'>('educational');

  const getDateFilters = () => {
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return dateRange === 'all' ? undefined : {
      start_date: start.toISOString(),
      end_date: now.toISOString(),
    };
  };

  const { data: financialData, isLoading: financialLoading, refetch: refetchFinancial } = useQuery({
    queryKey: ['bi-financial', dateRange],
    queryFn: () => BiDashboardService.getFinancialAnalytics(getDateFilters()),
    enabled: activeTab === 'financial',
  });

  const { data: educationalData, isLoading: educationalLoading, refetch: refetchEducational } = useQuery({
    queryKey: ['bi-educational', dateRange],
    queryFn: () => BiDashboardService.getEducationalAnalytics(getDateFilters()),
    enabled: activeTab === 'educational',
  });

  const { data: funnelData, isLoading: funnelLoading, refetch: refetchFunnel } = useQuery({
    queryKey: ['bi-funnel', dateRange],
    queryFn: () => BiDashboardService.getFunnelMetrics(getDateFilters()),
    enabled: activeTab === 'funnel',
  });

  const handleExport = async (type: 'financial' | 'educational' | 'funnel') => {
    try {
      const csv = await BiDashboardService.exportToCSV(type, getDateFilters());
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'financial') refetchFinancial();
    if (activeTab === 'educational') refetchEducational();
    if (activeTab === 'funnel') refetchFunnel();
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('analytics.title', 'Analytics Dashboard')}</h1>
          <p className="text-muted-foreground">{t('analytics.subtitle', 'Inzichten in platform prestaties')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={(v: '7d' | '30d' | '90d' | 'all') => setDateRange(v)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 me-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('analytics.last7days', 'Laatste 7 dagen')}</SelectItem>
              <SelectItem value="30d">{t('analytics.last30days', 'Laatste 30 dagen')}</SelectItem>
              <SelectItem value="90d">{t('analytics.last90days', 'Laatste 90 dagen')}</SelectItem>
              <SelectItem value="all">{t('analytics.allTime', 'Alle tijd')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => handleExport(activeTab)}>
            <Download className="h-4 w-4 me-2" />
            {t('analytics.export', 'Exporteren')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="educational" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analytics.educational', 'Educatief')}</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analytics.financial', 'Financieel')}</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analytics.funnel', 'Funnel')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Educational Tab */}
        <TabsContent value="educational" className="space-y-6 mt-6">
          {educationalLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title={t('analytics.totalStudents', 'Totaal Studenten')}
                  value={educationalData?.total_students || 0}
                  icon={Users}
                />
                <MetricCard
                  title={t('analytics.activeStudents', 'Actieve Studenten')}
                  value={educationalData?.active_students || 0}
                  subtitle={`${((educationalData?.active_students || 0) / Math.max(1, educationalData?.total_students || 1) * 100).toFixed(0)}% actief`}
                  icon={Users}
                  trend="up"
                />
                <MetricCard
                  title={t('analytics.avgAccuracy', 'Gem. Nauwkeurigheid')}
                  value={`${((educationalData?.avg_accuracy || 0) * 100).toFixed(1)}%`}
                  icon={GraduationCap}
                />
                <MetricCard
                  title={t('analytics.completionRate', 'Voltooiingspercentage')}
                  value={`${((educationalData?.completion_rate || 0) * 100).toFixed(1)}%`}
                  icon={TrendingUp}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Progress by Level */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.progressByLevel', 'Voortgang per Niveau')}</CardTitle>
                    <CardDescription>{t('analytics.progressByLevelDesc', 'Studenten en punten per niveau')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={educationalData?.student_progress || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="level_name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="student_count" fill="hsl(var(--primary))" name={t('analytics.students', 'Studenten')} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="avg_points" fill="hsl(var(--secondary))" name={t('analytics.avgPoints', 'Gem. Punten')} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Engagement Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.engagementTrend', 'Engagement Trend')}</CardTitle>
                    <CardDescription>{t('analytics.engagementTrendDesc', 'Sessies over tijd')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={educationalData?.engagement_trend || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                          }} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="total_sessions" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name={t('analytics.sessions', 'Sessies')} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Topics Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-destructive">{t('analytics.weakTopics', 'Zwakke Onderwerpen')}</CardTitle>
                    <CardDescription>{t('analytics.weakTopicsDesc', 'Onderwerpen die extra aandacht nodig hebben')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {educationalData?.weak_topics?.length ? (
                      <ul className="space-y-3">
                        {educationalData.weak_topics.slice(0, 5).map((topic, i) => (
                          <li key={i} className="flex justify-between items-center p-2 rounded-md bg-destructive/10">
                            <span className="font-medium">{topic.topic}</span>
                            <span className="text-muted-foreground text-sm">{topic.student_count} {t('analytics.studentsNeedHelp', 'studenten')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">{t('analytics.noWeakTopics', 'Geen zwakke onderwerpen geïdentificeerd')}</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">{t('analytics.strongTopics', 'Sterke Onderwerpen')}</CardTitle>
                    <CardDescription>{t('analytics.strongTopicsDesc', 'Onderwerpen waar studenten goed in zijn')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {educationalData?.strong_topics?.length ? (
                      <ul className="space-y-3">
                        {educationalData.strong_topics.slice(0, 5).map((topic, i) => (
                          <li key={i} className="flex justify-between items-center p-2 rounded-md bg-green-500/10">
                            <span className="font-medium">{topic.topic}</span>
                            <span className="text-muted-foreground text-sm">{topic.student_count} {t('analytics.studentsExcel', 'studenten')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">{t('analytics.noStrongTopics', 'Geen sterke onderwerpen geïdentificeerd')}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6 mt-6">
          {financialLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title={t('analytics.totalRevenue', 'Totale Omzet')}
                  value={`€${((financialData?.total_revenue || 0) / 100).toFixed(2)}`}
                  icon={DollarSign}
                />
                <MetricCard
                  title={t('analytics.payingStudents', 'Betalende Studenten')}
                  value={financialData?.paying_students || 0}
                  icon={Users}
                />
                <MetricCard
                  title={t('analytics.avgRevenue', 'Gem. Omzet/Student')}
                  value={`€${((financialData?.average_revenue_per_student || 0) / 100).toFixed(2)}`}
                  icon={TrendingUp}
                />
                <MetricCard
                  title={t('analytics.conversionRate', 'Conversieratio')}
                  value={`${((financialData?.conversion_rate || 0) * 100).toFixed(1)}%`}
                  icon={TrendingUp}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.revenueByModule', 'Omzet per Module')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={financialData?.revenue_by_module || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis type="category" dataKey="module_name" width={120} className="text-xs" />
                        <Tooltip 
                          formatter={(value: number) => [`€${(value / 100).toFixed(2)}`, t('analytics.revenue', 'Omzet')]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                          }} 
                        />
                        <Bar dataKey="total_revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.revenueTrend', 'Omzet Trend')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={financialData?.revenue_trend || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          formatter={(value: number) => [`€${(value / 100).toFixed(2)}`, t('analytics.revenue', 'Omzet')]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                          }} 
                        />
                        <Line type="monotone" dataKey="total_revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6 mt-6">
          {funnelLoading ? (
            <LoadingSkeleton />
          ) : funnelData ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                  title={t('analytics.registrations', 'Registraties')}
                  value={funnelData.registration}
                  icon={Users}
                />
                <MetricCard
                  title={t('analytics.firstLogin', 'Eerste Login')}
                  value={funnelData.first_login}
                  subtitle={`${(funnelData.conversion_rates.registration_to_login * 100).toFixed(0)}%`}
                  icon={Users}
                />
                <MetricCard
                  title={t('analytics.firstLesson', 'Eerste Les')}
                  value={funnelData.first_lesson}
                  subtitle={`${(funnelData.conversion_rates.login_to_lesson * 100).toFixed(0)}%`}
                  icon={GraduationCap}
                />
                <MetricCard
                  title={t('analytics.firstCompletion', 'Eerste Voltooiing')}
                  value={funnelData.first_completion}
                  subtitle={`${(funnelData.conversion_rates.lesson_to_completion * 100).toFixed(0)}%`}
                  icon={TrendingUp}
                />
                <MetricCard
                  title={t('analytics.activeUsers', 'Actieve Gebruikers')}
                  value={funnelData.active_users}
                  subtitle={`${(funnelData.conversion_rates.completion_to_active * 100).toFixed(0)}%`}
                  icon={Users}
                  trend="up"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.funnelTitle', 'Conversie Funnel')}</CardTitle>
                  <CardDescription>{t('analytics.funnelDesc', 'Gebruikersreis van registratie tot actieve gebruiker')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <FunnelChart data={funnelData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.conversionRates', 'Conversieratio\'s')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">{(funnelData.conversion_rates.registration_to_login * 100).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Registratie → Login</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">{(funnelData.conversion_rates.login_to_lesson * 100).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Login → Les</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">{(funnelData.conversion_rates.lesson_to_completion * 100).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Les → Voltooiing</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">{(funnelData.conversion_rates.completion_to_active * 100).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Voltooiing → Actief</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
