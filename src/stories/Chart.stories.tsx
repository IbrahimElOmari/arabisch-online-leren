import type { Meta, StoryObj } from '@storybook/react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const meta: Meta = {
  title: 'UI/Chart',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Sample data
const monthlyData = [
  { month: 'Jan', studenten: 186, lessen: 80 },
  { month: 'Feb', studenten: 305, lessen: 120 },
  { month: 'Mrt', studenten: 237, lessen: 95 },
  { month: 'Apr', studenten: 273, lessen: 110 },
  { month: 'Mei', studenten: 209, lessen: 85 },
  { month: 'Jun', studenten: 314, lessen: 130 },
];

const progressData = [
  { week: 'Week 1', voortgang: 20 },
  { week: 'Week 2', voortgang: 35 },
  { week: 'Week 3', voortgang: 45 },
  { week: 'Week 4', voortgang: 60 },
  { week: 'Week 5', voortgang: 72 },
  { week: 'Week 6', voortgang: 85 },
];

const pieData = [
  { name: 'Beginner', value: 400, fill: 'hsl(var(--chart-1))' },
  { name: 'Intermediair', value: 300, fill: 'hsl(var(--chart-2))' },
  { name: 'Gevorderd', value: 200, fill: 'hsl(var(--chart-3))' },
  { name: 'Expert', value: 100, fill: 'hsl(var(--chart-4))' },
];

// Chart configs
const barChartConfig: ChartConfig = {
  studenten: {
    label: 'Studenten',
    color: 'hsl(var(--chart-1))',
  },
  lessen: {
    label: 'Lessen',
    color: 'hsl(var(--chart-2))',
  },
};

const lineChartConfig: ChartConfig = {
  voortgang: {
    label: 'Voortgang',
    color: 'hsl(var(--chart-1))',
  },
};

const pieChartConfig: ChartConfig = {
  beginner: {
    label: 'Beginner',
    color: 'hsl(var(--chart-1))',
  },
  intermediair: {
    label: 'Intermediair',
    color: 'hsl(var(--chart-2))',
  },
  gevorderd: {
    label: 'Gevorderd',
    color: 'hsl(var(--chart-3))',
  },
  expert: {
    label: 'Expert',
    color: 'hsl(var(--chart-4))',
  },
};

export const BarChartDefault: Story = {
  render: () => (
    <ChartContainer config={barChartConfig} className="h-[300px] w-full">
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="studenten" fill="var(--color-studenten)" radius={4} />
        <Bar dataKey="lessen" fill="var(--color-lessen)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const BarChartStacked: Story = {
  render: () => (
    <ChartContainer config={barChartConfig} className="h-[300px] w-full">
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="studenten" stackId="a" fill="var(--color-studenten)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="lessen" stackId="a" fill="var(--color-lessen)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  ),
};

export const LineChartDefault: Story = {
  render: () => (
    <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
      <LineChart data={progressData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="voortgang"
          stroke="var(--color-voortgang)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-voortgang)' }}
        />
      </LineChart>
    </ChartContainer>
  ),
};

export const AreaChartDefault: Story = {
  render: () => (
    <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
      <AreaChart data={progressData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="voortgang"
          stroke="var(--color-voortgang)"
          fill="var(--color-voortgang)"
          fillOpacity={0.3}
        />
      </AreaChart>
    </ChartContainer>
  ),
};

export const PieChartDefault: Story = {
  render: () => (
    <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  ),
};

export const PieChartDonut: Story = {
  render: () => (
    <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          label
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  ),
};

// Multi-line chart data
const multiLineData = [
  { week: 'Week 1', lezen: 20, schrijven: 15, spreken: 10 },
  { week: 'Week 2', lezen: 35, schrijven: 28, spreken: 22 },
  { week: 'Week 3', lezen: 45, schrijven: 40, spreken: 35 },
  { week: 'Week 4', lezen: 60, schrijven: 52, spreken: 48 },
  { week: 'Week 5', lezen: 72, schrijven: 65, spreken: 60 },
  { week: 'Week 6', lezen: 85, schrijven: 78, spreken: 72 },
];

const multiLineConfig: ChartConfig = {
  lezen: {
    label: 'Lezen',
    color: 'hsl(var(--chart-1))',
  },
  schrijven: {
    label: 'Schrijven',
    color: 'hsl(var(--chart-2))',
  },
  spreken: {
    label: 'Spreken',
    color: 'hsl(var(--chart-3))',
  },
};

export const MultiLineChart: Story = {
  render: () => (
    <ChartContainer config={multiLineConfig} className="h-[300px] w-full">
      <LineChart data={multiLineData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="lezen"
          stroke="var(--color-lezen)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="schrijven"
          stroke="var(--color-schrijven)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="spreken"
          stroke="var(--color-spreken)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  ),
};

// Horizontal Bar Chart
export const HorizontalBarChart: Story = {
  render: () => (
    <ChartContainer config={barChartConfig} className="h-[300px] w-full">
      <BarChart data={monthlyData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="month" type="category" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="studenten" fill="var(--color-studenten)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

// RTL Chart
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="font-arabic">
      <ChartContainer config={barChartConfig} className="h-[300px] w-full">
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="studenten" fill="var(--color-studenten)" radius={4} />
          <Bar dataKey="lessen" fill="var(--color-lessen)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Chart with Right-to-Left layout support',
      },
    },
  },
};

// Compact Chart
export const Compact: Story = {
  render: () => (
    <ChartContainer config={lineChartConfig} className="h-[150px] w-[300px]">
      <LineChart data={progressData}>
        <Line
          type="monotone"
          dataKey="voortgang"
          stroke="var(--color-voortgang)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  ),
};

// With Custom Tooltip
export const CustomTooltip: Story = {
  render: () => (
    <ChartContainer config={barChartConfig} className="h-[300px] w-full">
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <ChartTooltip
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar dataKey="studenten" fill="var(--color-studenten)" radius={4} />
        <Bar dataKey="lessen" fill="var(--color-lessen)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const AccessibilityTest: Story = {
  render: () => (
    <ChartContainer 
      config={barChartConfig} 
      className="h-[300px] w-full"
      aria-label="Maandelijkse statistieken grafiek"
    >
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="studenten" fill="var(--color-studenten)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'svg-img-alt', enabled: true },
        ],
      },
    },
  },
};
