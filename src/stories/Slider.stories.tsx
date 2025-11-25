import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label>Volume</Label>
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  ),
};

export const WithValue: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label>Moeilijkheidsgraad: 75%</Label>
      <Slider defaultValue={[75]} max={100} step={5} />
    </div>
  ),
};

export const Range: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label>Leeftijdsbereik: 12 - 18</Label>
      <Slider defaultValue={[12, 18]} max={25} step={1} minStepsBetweenThumbs={1} />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label>Uitgeschakeld</Label>
      <Slider defaultValue={[30]} max={100} step={1} disabled />
    </div>
  ),
};
