import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Ik accepteer de voorwaarden</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="completed" defaultChecked />
      <Label htmlFor="completed">Taak voltooid</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled" disabled />
      <Label htmlFor="disabled">Niet beschikbaar</Label>
    </div>
  ),
};

export const MultipleCheckboxes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="grammar" defaultChecked />
        <Label htmlFor="grammar">Grammatica oefeningen</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="vocab" />
        <Label htmlFor="vocab">Vocabulaire training</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="listening" defaultChecked />
        <Label htmlFor="listening">Luisteroefeningen</Label>
      </div>
    </div>
  ),
};
