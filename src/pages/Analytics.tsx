import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsStore } from '@/hooks/useAnalyticsStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Users, TrendingUp, Award } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { useUserRole } from '@/hooks/useUserRole';

export const AnalyticsDashboard = () => {
  const { isAdmin } = useUserRole();
  const { analyticsData, loading, fetchAnalytics } = useAnalyticsStore();
  const { getFlexDirection, getTextAlign, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, fetchAnalytics]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}u ${minutes}m`;
  };

  if (!isAdmin) {
    return (
      <div className={`${getTextAlign('center')} py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>{t('errors.accessDenied')}</p>
      </div>
    );
  }

  if (loading) {
    return <div className={`${getTextAlign('center')} py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
      <span className={isRTL ? 'arabic-text' : ''}>{t('analytics.loading')}</span>
    </div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className={`text-3xl font-bold ${getTextAlign('left')} ${isRTL ? 'arabic-text font-amiri' : ''}`}>{t('analytics.dashboard')}</h1>
      
      {analyticsData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className={`${getFlexDirection()} items-center justify-between pb-2`}>
                <CardTitle className={`text-sm font-medium ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.totalTime')}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTextAlign('left')}`}>
                  {formatTime(analyticsData.totalTimeSpent)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={`${getFlexDirection()} items-center justify-between pb-2`}>
                <CardTitle className={`text-sm font-medium ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.sessionsToday')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTextAlign('left')}`}>{analyticsData.sessionsToday}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={`${getFlexDirection()} items-center justify-between pb-2`}>
                <CardTitle className={`text-sm font-medium ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.avgSessionLength')}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTextAlign('left')}`}>
                  {formatTime(analyticsData.averageSessionLength)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={`${getFlexDirection()} items-center justify-between pb-2`}>
                <CardTitle className={`text-sm font-medium ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.activeUsers')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTextAlign('left')}`}>{analyticsData.topUsers.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Users Chart */}
          <Card>
            <CardHeader>
              <CardTitle className={`${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.topUsers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.topUsers.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="full_name" angle={isRTL ? 45 : -45} textAnchor={isRTL ? 'start' : 'end'} height={100} />
                  <YAxis tickFormatter={formatTime} orientation={isRTL ? 'right' : 'left'} />
                  <Tooltip formatter={(value: number) => [formatTime(value), t('analytics.time')]} />
                  <Bar dataKey="total_time" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className={`${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.userStats')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className={`${getTextAlign('left')} p-2 ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.name')}</th>
                      <th className={`${getTextAlign('left')} p-2 ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.totalTime')}</th>
                      <th className={`${getTextAlign('left')} p-2 ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.sessions')}</th>
                      <th className={`${getTextAlign('left')} p-2 ${isRTL ? 'arabic-text' : ''}`}>{t('analytics.avgPerSession')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topUsers.map((user, index) => (
                      <tr key={user.user_id} className="border-b">
                        <td className={`p-2 ${getFlexDirection()} items-center gap-2`}>
                          {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                          <span>{user.full_name}</span>
                        </td>
                        <td className="p-2">{formatTime(user.total_time)}</td>
                        <td className="p-2">{user.session_count}</td>
                        <td className="p-2">
                          {formatTime(Math.round(user.total_time / user.session_count))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

const Analytics = () => {
  return <AnalyticsDashboard />;
};

export default Analytics;
