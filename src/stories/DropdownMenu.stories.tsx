import type { Meta, StoryObj } from '@storybook/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Settings, 
  LogOut, 
  Mail, 
  MessageSquare, 
  PlusCircle,
  Cloud,
  CreditCard,
  Keyboard,
  LifeBuoy,
  Plus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';

const meta: Meta = {
  title: 'UI/DropdownMenu',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Menu openen</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Mijn Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="me-2 h-4 w-4" />
          <span>Profiel</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="me-2 h-4 w-4" />
          <span>Instellingen</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="me-2 h-4 w-4" />
          <span>Uitloggen</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithShortcuts: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Acties</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Sneltoetsen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Mail className="me-2 h-4 w-4" />
          <span>E-mail</span>
          <DropdownMenuShortcut>⌘M</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MessageSquare className="me-2 h-4 w-4" />
          <span>Berichten</span>
          <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <PlusCircle className="me-2 h-4 w-4" />
          <span>Nieuw item</span>
          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithCheckboxItems: Story = {
  render: () => {
    const [showStatusBar, setShowStatusBar] = useState(true);
    const [showActivityBar, setShowActivityBar] = useState(false);
    const [showPanel, setShowPanel] = useState(false);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Weergave opties</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Weergave</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={showStatusBar}
            onCheckedChange={setShowStatusBar}
          >
            Statusbalk
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showActivityBar}
            onCheckedChange={setShowActivityBar}
          >
            Activiteitenbalk
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showPanel}
            onCheckedChange={setShowPanel}
          >
            Paneel
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

export const WithRadioItems: Story = {
  render: () => {
    const [position, setPosition] = useState('bottom');

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Positie: {position}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Paneel Positie</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
            <DropdownMenuRadioItem value="top">Boven</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bottom">Onder</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="right">Rechts</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

export const WithSubMenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Geavanceerd menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Mijn Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="me-2 h-4 w-4" />
            <span>Profiel</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="me-2 h-4 w-4" />
            <span>Facturatie</span>
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="me-2 h-4 w-4" />
            <span>Instellingen</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Keyboard className="me-2 h-4 w-4" />
            <span>Sneltoetsen</span>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Users className="me-2 h-4 w-4" />
            <span>Team</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserPlus className="me-2 h-4 w-4" />
              <span>Uitnodigen</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>
                <Mail className="me-2 h-4 w-4" />
                <span>E-mail</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="me-2 h-4 w-4" />
                <span>Bericht</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <PlusCircle className="me-2 h-4 w-4" />
                <span>Meer...</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            <Plus className="me-2 h-4 w-4" />
            <span>Nieuw team</span>
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Cloud className="me-2 h-4 w-4" />
          <span>Cloud</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LifeBuoy className="me-2 h-4 w-4" />
          <span>Ondersteuning</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="me-2 h-4 w-4" />
          <span>Uitloggen</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const DisabledItems: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Met uitgeschakelde items</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Acties</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Actief item</DropdownMenuItem>
        <DropdownMenuItem disabled>Uitgeschakeld item</DropdownMenuItem>
        <DropdownMenuItem>Nog een actief item</DropdownMenuItem>
        <DropdownMenuItem disabled>Ook uitgeschakeld</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">القائمة</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>حسابي</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="ms-2 h-4 w-4" />
            <span>الملف الشخصي</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="ms-2 h-4 w-4" />
            <span>الإعدادات</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="ms-2 h-4 w-4" />
            <span>تسجيل الخروج</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dropdown menu in Right-to-Left (Arabic) context',
      },
    },
  },
};

export const Inset: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Inset items</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel inset>Mijn Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem inset>Profiel</DropdownMenuItem>
        <DropdownMenuItem inset>Instellingen</DropdownMenuItem>
        <DropdownMenuItem inset>Uitloggen</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const AccessibilityTest: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="Open menu">Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Navigatie</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Item 1</DropdownMenuItem>
        <DropdownMenuItem>Item 2</DropdownMenuItem>
        <DropdownMenuItem>Item 3</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
};
