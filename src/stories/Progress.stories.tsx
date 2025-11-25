import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '@/components/ui/progress';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Progress value={33} />
    </div>
  ),
};

export const HalfComplete: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <div className="text-sm text-muted-foreground">Voortgang: 50%</div>
      <Progress value={50} />
    </div>
  ),
};

export const AlmostDone: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <div className="text-sm text-muted-foreground">Bijna klaar: 85%</div>
      <Progress value={85} />
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <div>
        <div className="text-sm font-medium mb-2">Grammatica: 75%</div>
        <Progress value={75} />
      </div>
      <div>
        <div className="text-sm font-medium mb-2">Vocabulaire: 45%</div>
        <Progress value={45} />
      </div>
      <div>
        <div className="text-sm font-medium mb-2">Luisteren: 90%</div>
        <Progress value={90} />
      </div>
    </div>
  ),
};
