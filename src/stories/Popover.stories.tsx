import type { Meta, StoryObj } from '@storybook/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Bell, User, Calendar } from 'lucide-react';

const meta: Meta = {
  title: 'UI/Popover',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Afmetingen</h4>
            <p className="text-sm text-muted-foreground">
              Stel de afmetingen in voor de laag.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Breedte</Label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. breedte</Label>
              <Input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Hoogte</Label>
              <Input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Instellingen</h4>
            <p className="text-sm text-muted-foreground">
              Configureer uw voorkeuren.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="notifications" className="rounded" />
              <Label htmlFor="notifications">Notificaties inschakelen</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="dark-mode" className="rounded" />
              <Label htmlFor="dark-mode">Donkere modus</Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const NotificationPopover: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Notificaties</h4>
            <Button variant="ghost" size="sm">Alles markeren als gelezen</Button>
          </div>
          <div className="grid gap-2">
            <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium">Nieuwe les beschikbaar</p>
                <p className="text-xs text-muted-foreground">2 minuten geleden</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium">Certificaat behaald</p>
                <p className="text-xs text-muted-foreground">1 uur geleden</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium">Nieuw bericht van docent</p>
                <p className="text-xs text-muted-foreground">3 uur geleden</p>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
              AH
            </div>
            <div>
              <p className="font-medium">Ahmed Hassan</p>
              <p className="text-xs text-muted-foreground">ahmed@example.com</p>
            </div>
          </div>
          <div className="border-t pt-2">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <User className="me-2 h-4 w-4" />
              Profiel bekijken
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Settings className="me-2 h-4 w-4" />
              Instellingen
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive" size="sm">
              Uitloggen
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const DatePicker: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start">
          <Calendar className="me-2 h-4 w-4" />
          Selecteer een datum
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-2">
            Hier zou normaal een kalender component staan.
          </p>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
              <div key={day} className="p-2 font-medium">{day}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => (
              <Button key={i} variant="ghost" size="sm" className="h-8 w-8 p-0">
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top">
          <p>Dit is een popover aan de bovenkant.</p>
        </PopoverContent>
      </Popover>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom">
          <p>Dit is een popover aan de onderkant.</p>
        </PopoverContent>
      </Popover>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Left</Button>
        </PopoverTrigger>
        <PopoverContent side="left">
          <p>Dit is een popover links.</p>
        </PopoverContent>
      </Popover>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Right</Button>
        </PopoverTrigger>
        <PopoverContent side="right">
          <p>Dit is een popover rechts.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const Alignments: Story = {
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <p>Uitgelijnd aan het begin.</p>
        </PopoverContent>
      </Popover>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Center</Button>
        </PopoverTrigger>
        <PopoverContent align="center">
          <p>Uitgelijnd in het midden.</p>
        </PopoverContent>
      </Popover>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">End</Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <p>Uitgelijnd aan het einde.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="font-arabic">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">افتح</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">الإعدادات</h4>
              <p className="text-sm text-muted-foreground">
                قم بتكوين إعدادات العرض.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="width-rtl">العرض</Label>
                <Input
                  id="width-rtl"
                  defaultValue="100%"
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="height-rtl">الارتفاع</Label>
                <Input
                  id="height-rtl"
                  defaultValue="25px"
                  className="col-span-2 h-8"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Popover in Right-to-Left (Arabic) context',
      },
    },
  },
};

export const AccessibilityTest: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label="Open instellingen menu">
          Instellingen
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" role="dialog" aria-label="Instellingen dialoog">
        <div className="grid gap-4">
          <h4 className="font-medium leading-none" id="popover-title">Instellingen</h4>
          <div className="grid gap-2">
            <Label htmlFor="setting-1">Instelling 1</Label>
            <Input id="setting-1" aria-describedby="popover-title" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'button-name', enabled: true },
          { id: 'aria-dialog-name', enabled: true },
        ],
      },
    },
  },
};
