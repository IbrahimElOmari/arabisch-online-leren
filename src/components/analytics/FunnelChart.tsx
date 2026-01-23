import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { FunnelMetrics } from '@/services/biDashboardService';

interface FunnelChartProps {
  data: FunnelMetrics;
}

export function FunnelChart({ data }: FunnelChartProps) {
  const { t } = useTranslation();

  const chartData = [
    { 
      name: t('analytics.registrations', 'Registraties'), 
      value: data.registration, 
      fill: 'hsl(var(--primary))' 
    },
    { 
      name: t('analytics.firstLogin', 'Eerste Login'), 
      value: data.first_login, 
      fill: 'hsl(var(--primary) / 0.85)' 
    },
    { 
      name: t('analytics.firstLesson', 'Eerste Les'), 
      value: data.first_lesson, 
      fill: 'hsl(var(--primary) / 0.7)' 
    },
    { 
      name: t('analytics.firstCompletion', 'Eerste Voltooiing'), 
      value: data.first_completion, 
      fill: 'hsl(var(--primary) / 0.55)' 
    },
    { 
      name: t('analytics.activeUsers', 'Actieve Gebruikers'), 
      value: data.active_users, 
      fill: 'hsl(var(--primary) / 0.4)' 
    },
  ];

  // Calculate drop-off percentages
  const calculateDropoff = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((previous - current) / previous * 100).toFixed(1);
  };

  const chartDataWithDropoff = chartData.map((item, index) => ({
    ...item,
    dropoff: index > 0 ? calculateDropoff(item.value, chartData[index - 1].value) : null,
  }));

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={chartDataWithDropoff} 
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={140} 
            tick={{ fontSize: 12 }}
            className="text-foreground"
          />
          <Tooltip 
            formatter={(value: number) => [value.toLocaleString(), t('analytics.users', 'Gebruikers')]}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)'
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 8, 8, 0]}
            maxBarSize={50}
          >
            {chartDataWithDropoff.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList 
              dataKey="value" 
              position="right" 
              formatter={(value: number) => value.toLocaleString()}
              style={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Drop-off indicators */}
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        {chartDataWithDropoff.slice(1).map((item, index) => (
          <div 
            key={index} 
            className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full"
          >
            <span className="text-muted-foreground">{chartData[index].name} →</span>
            <span className="font-medium text-destructive">-{item.dropoff}%</span>
          </div>
        ))}
      </div>

      {/* Funnel visual representation */}
      <div className="relative mx-auto max-w-md mt-8">
        <div className="flex flex-col items-center gap-1">
          {chartData.map((item, index) => {
            const widthPercent = data.registration > 0 
              ? (item.value / data.registration * 100) 
              : 0;
            return (
              <div
                key={index}
                className="h-10 rounded-sm flex items-center justify-center text-xs font-medium transition-all"
                style={{
                  width: `${Math.max(widthPercent, 20)}%`,
                  backgroundColor: item.fill,
                  color: index < 2 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                }}
              >
                {item.value.toLocaleString()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
