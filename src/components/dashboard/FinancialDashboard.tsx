import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import { BiDashboardService } from '@/services/biDashboardService';
import { useTranslation } from '@/contexts/TranslationContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const FinancialDashboard = () => {
  const { t } = useTranslation();

  const { data: financial, isLoading } = useQuery({
    queryKey: ['financial-analytics'],
    queryFn: () => BiDashboardService.getFinancialAnalytics(),
  });

  if (isLoading || !financial) {
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
      title: t('dashboard.total_revenue', 'Totale Omzet'),
      value: `€${(financial.total_revenue / 100).toFixed(2)}`,
      icon: DollarSign,
      trend: '+12.5%',
    },
    {
      title: t('dashboard.paying_students', 'Betalende Studenten'),
      value: financial.paying_students,
      icon: Users,
      trend: '+8.2%',
    },
    {
      title: t('dashboard.avg_revenue_per_student', 'Gem. Omzet per Student'),
      value: `€${(financial.average_revenue_per_student / 100).toFixed(2)}`,
      icon: TrendingUp,
      trend: '+4.1%',
    },
    {
      title: t('dashboard.conversion_rate', 'Conversie Ratio'),
      value: `${financial.conversion_rate.toFixed(1)}%`,
      icon: CreditCard,
      trend: '+2.3%',
    },
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
        {/* Revenue by Module */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.revenue_by_module', 'Omzet per Module')}</CardTitle>
            <CardDescription>Verdeling van inkomsten per module</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financial.revenue_by_module}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module_name" />
                <YAxis tickFormatter={(value) => `€${(value / 100).toFixed(0)}`} />
                <Tooltip formatter={(value: number) => `€${(value / 100).toFixed(2)}`} />
                <Bar dataKey="total_revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Level */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.revenue_by_level', 'Omzet per Niveau')}</CardTitle>
            <CardDescription>Verdeling van inkomsten per niveau</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={financial.revenue_by_level}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ level_name, percent }) => `${level_name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_revenue"
                >
                  {financial.revenue_by_level.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `€${(value / 100).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.revenue_trend', 'Omzet Trend')}</CardTitle>
            <CardDescription>Dagelijkse omzet ontwikkeling</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financial.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(value) => `€${(value / 100).toFixed(0)}`} />
                <Tooltip 
                  formatter={(value: number) => `€${(value / 100).toFixed(2)}`}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('nl-NL')}
                />
                <Legend />
                <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Currency Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.currency_breakdown', 'Valuta Verdeling')}</CardTitle>
            <CardDescription>Betalingen per valuta</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financial.currency_breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="currency" />
                <YAxis tickFormatter={(value) => `${value}`} />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" name="Aantal Betalingen" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.payment_methods', 'Betaalmethoden')}</CardTitle>
          <CardDescription>Verdeling van gebruikte betaalmethoden</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={financial.payment_methods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ payment_method, percent }) => `${payment_method || 'Onbekend'}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {financial.payment_methods.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
