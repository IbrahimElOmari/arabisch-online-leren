import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert className="w-[400px]">
      <Info className="h-4 w-4" />
      <AlertTitle>Let op</AlertTitle>
      <AlertDescription>
        Je hebt nog 3 lessen te voltooien deze week.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-[400px]">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Fout</AlertTitle>
      <AlertDescription>
        Je sessie is verlopen. Log opnieuw in om door te gaan.
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert className="w-[400px] border-green-500 text-green-700 dark:text-green-400">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Gelukt!</AlertTitle>
      <AlertDescription>
        Je taak is succesvol ingediend en wacht op beoordeling.
      </AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert className="w-[400px] border-yellow-500 text-yellow-700 dark:text-yellow-400">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Waarschuwing</AlertTitle>
      <AlertDescription>
        Je huidige niveau vereist minimaal 80% score om door te gaan.
      </AlertDescription>
    </Alert>
  ),
};
