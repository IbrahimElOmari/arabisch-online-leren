import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Loader2, 
  Download as DownloadIcon, 
  Trash2, 
  Plus, 
  ChevronRight, 
  Check,
  ArrowRight,
  Send,
  Save
} from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'icon'],
      description: 'The visual variant of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'touch', 'icon'],
      description: 'The size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as child element',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ==================== Basic Variants ====================

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Verwijderen',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Link Style',
    variant: 'link',
  },
};

// ==================== Sizes ====================

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

export const Touch: Story = {
  args: {
    children: 'Touch Friendly',
    size: 'touch',
  },
  parameters: {
    docs: {
      description: {
        story: 'Touch-friendly size with minimum 44px height for mobile accessibility',
      },
    },
  },
};

export const IconSize: Story = {
  args: {
    size: 'icon',
    children: <Mail className="h-4 w-4" />,
    'aria-label': 'Email versturen',
  },
};

// ==================== With Icons ====================

export const WithIconLeft: Story = {
  args: {
    children: (
      <>
        <Mail className="h-4 w-4" />
        Email Versturen
      </>
    ),
  },
};

export const WithIconRight: Story = {
  args: {
    children: (
      <>
        Volgende
        <ChevronRight className="h-4 w-4" />
      </>
    ),
  },
};

export const DownloadButton: Story = {
  args: {
    children: (
      <>
        <DownloadIcon className="h-4 w-4" />
        Downloaden
      </>
    ),
    variant: 'outline',
  },
};

export const Delete: Story = {
  args: {
    children: (
      <>
        <Trash2 className="h-4 w-4" />
        Verwijderen
      </>
    ),
    variant: 'destructive',
  },
};

export const Add: Story = {
  args: {
    children: (
      <>
        <Plus className="h-4 w-4" />
        Toevoegen
      </>
    ),
  },
};

// ==================== States ====================

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Laden...
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Success: Story = {
  render: () => (
    <Button className="bg-success hover:bg-success/90 text-success-foreground">
      <Check className="h-4 w-4" />
      Opgeslagen
    </Button>
  ),
};

// ==================== Button Groups ====================

export const ButtonGroup: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="outline">Annuleren</Button>
      <Button>Opslaan</Button>
    </div>
  ),
};

export const SplitButton: Story = {
  render: () => (
    <div className="flex">
      <Button className="rounded-e-none">
        <Save className="h-4 w-4" />
        Opslaan
      </Button>
      <Button variant="outline" className="rounded-s-none border-s-0 px-2">
        <ChevronRight className="h-4 w-4 rotate-90" />
      </Button>
    </div>
  ),
};

// ==================== Full Width ====================

export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <Button className="w-full">
        Inloggen
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  ),
};

// ==================== All Variants ====================

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="touch">Touch</Button>
      <Button size="icon"><Mail className="h-4 w-4" /></Button>
    </div>
  ),
};

// ==================== RTL Support ====================

export const RTL: Story = {
  args: {
    children: 'زر عربي',
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button in Right-to-Left (Arabic) context',
      },
    },
  },
  decorators: [
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
};

export const RTLWithIcon: Story = {
  render: () => (
    <div dir="rtl">
      <Button>
        <Send className="h-4 w-4" />
        إرسال
      </Button>
    </div>
  ),
};

// ==================== Accessibility ====================

export const AccessibilityTest: Story = {
  args: {
    children: 'Accessible Button',
    'aria-label': 'Dit is een toegankelijke knop',
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
};

export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>Eerste</Button>
      <Button>Tweede</Button>
      <Button>Derde</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use Tab to navigate between buttons and Enter/Space to activate',
      },
    },
  },
};

// ==================== Use Cases ====================

export const CTAButton: Story = {
  render: () => (
    <Button size="lg" className="px-8">
      Start Je Gratis Proefperiode
      <ArrowRight className="h-5 w-5" />
    </Button>
  ),
};

export const SubmitButton: Story = {
  render: () => (
    <Button type="submit" className="w-full max-w-xs">
      <Check className="h-4 w-4" />
      Inzenden
    </Button>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button size="icon" variant="ghost" aria-label="Email">
        <Mail className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Download">
        <DownloadIcon className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Verwijderen">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Toevoegen">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
};
