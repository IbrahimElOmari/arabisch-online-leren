import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search as SearchIcon, Mail, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'tel', 'url'],
      description: 'The type of input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Typ hier...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">E-mailadres</Label>
      <Input type="email" id="email" placeholder="ahmed@example.com" />
    </div>
  ),
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'jouw@email.nl',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Wachtwoord',
  },
};

export const PasswordWithToggle: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <div className="relative w-full max-w-sm">
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Wachtwoord"
          className="pe-10"
        />
        <button
          type="button"
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
};

export const SearchInput: Story = {
  render: () => (
    <div className="relative w-full max-w-sm">
      <SearchIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Zoeken..." className="ps-10" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="relative w-full max-w-sm">
      <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="email" placeholder="E-mailadres" className="ps-10" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: 'Uitgeschakeld',
    disabled: true,
  },
};

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'Bestaande waarde',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
};

export const File: Story = {
  args: {
    type: 'file',
  },
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="error-input" className="text-destructive">
        E-mailadres
      </Label>
      <Input
        type="email"
        id="error-input"
        placeholder="ahmed@example.com"
        className="border-destructive focus-visible:ring-destructive"
        aria-invalid="true"
      />
      <p className="text-sm text-destructive">Ongeldig e-mailadres</p>
    </div>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="w-full max-w-sm">
      <Label htmlFor="arabic-input">الاسم</Label>
      <Input
        id="arabic-input"
        placeholder="أدخل اسمك"
        className="text-right"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input in Right-to-Left (Arabic) context',
      },
    },
  },
};

export const FormExample: Story = {
  render: () => (
    <form className="grid w-full max-w-sm gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Naam</Label>
        <Input id="name" placeholder="Volledige naam" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="form-email">E-mailadres</Label>
        <Input type="email" id="form-email" placeholder="jouw@email.nl" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="form-password">Wachtwoord</Label>
        <Input type="password" id="form-password" placeholder="••••••••" />
      </div>
    </form>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <Input placeholder="Default size" />
      <Input placeholder="Small text" className="h-8 text-xs" />
      <Input placeholder="Large text" className="h-12 text-lg" />
    </div>
  ),
};

export const AccessibilityTest: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="a11y-input">Toegankelijk invoerveld</Label>
      <Input
        id="a11y-input"
        placeholder="Typ hier..."
        aria-describedby="a11y-description"
      />
      <p id="a11y-description" className="text-sm text-muted-foreground">
        Dit invoerveld is volledig toegankelijk
      </p>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
        ],
      },
    },
  },
};
