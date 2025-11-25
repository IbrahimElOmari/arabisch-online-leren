import type { Meta, StoryObj } from '@storybook/react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Zijpaneel</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Lessen Overzicht</SheetTitle>
          <SheetDescription>
            Bekijk alle beschikbare lessen voor deze module.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Les content komt hier...
          </p>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const FromLeft: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Menu</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigatie Menu</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-2">
          <div className="text-sm py-2">Dashboard</div>
          <div className="text-sm py-2">Mijn Lessen</div>
          <div className="text-sm py-2">Voortgang</div>
          <div className="text-sm py-2">Instellingen</div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const FromTop: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Toon Bericht</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Nieuwe Melding</SheetTitle>
          <SheetDescription>
            Je hebt een nieuw bericht ontvangen van je docent.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
