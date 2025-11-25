import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from '@/components/ui/separator';

const meta = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-[400px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Arabische Taalles</h4>
        <p className="text-sm text-muted-foreground">
          Leer Arabisch vanaf het begin
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Module Details</h4>
        <p className="text-sm text-muted-foreground">
          6 niveaus • 150 lessen • Certificaat
        </p>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center gap-4">
      <div className="text-sm">Niveau A1</div>
      <Separator orientation="vertical" />
      <div className="text-sm">12 weken</div>
      <Separator orientation="vertical" />
      <div className="text-sm">€150</div>
    </div>
  ),
};

export const InList: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <div className="text-sm py-2">Dashboard</div>
      <Separator />
      <div className="text-sm py-2">Mijn Lessen</div>
      <Separator />
      <div className="text-sm py-2">Voortgang</div>
      <Separator />
      <div className="text-sm py-2">Instellingen</div>
    </div>
  ),
};
