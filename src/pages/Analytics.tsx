import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsStore } from '@/hooks/useAnalyticsStore';
import { useAuth } from '@/components/auth/AuthProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, Users, TrendingUp, Award } from 'lucide-react';

export const AnalyticsDashboard = () => {
  const { profile } = useAuth();
  const { analyticsData, loading, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAnalytics();
    }
  }, [profile, fetchAnalytics]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}u ${minutes}m`;
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Toegang geweigerd - Admin rechten vereist</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Analytics laden...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      {analyticsData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Totale Tijd</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(analyticsData.totalTimeSpent)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sessies Vandaag</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.sessionsToday}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gem. Sessielengte</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(analyticsData.averageSessionLength)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Actieve Gebruikers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.topUsers.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Users Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Gebruikers (Tijd Besteed)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.topUsers.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="full_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={formatTime} />
                  <Tooltip formatter={(value: number) => [formatTime(value), 'Tijd']} />
                  <Bar dataKey="total_time" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Gebruiker Statistieken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Naam</th>
                      <th className="text-left p-2">Totale Tijd</th>
                      <th className="text-left p-2">Sessies</th>
                      <th className="text-left p-2">Gem. per Sessie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topUsers.map((user, index) => (
                      <tr key={user.user_id} className="border-b">
                        <td className="p-2 flex items-center gap-2">
                          {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                          {user.full_name}
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