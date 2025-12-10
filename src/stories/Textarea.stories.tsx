import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <Textarea placeholder="Typ hier uw bericht..." />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="message">Bericht</Label>
      <Textarea id="message" placeholder="Typ hier uw bericht..." />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="bio">Biografie</Label>
      <Textarea id="bio" placeholder="Vertel iets over uzelf..." />
      <p className="text-sm text-muted-foreground">
        Dit wordt weergegeven op uw openbare profiel.
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="disabled">Uitgeschakeld</Label>
      <Textarea
        id="disabled"
        placeholder="Dit veld is uitgeschakeld..."
        disabled
      />
    </div>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="default">Standaard waarde</Label>
      <Textarea
        id="default"
        defaultValue="Dit is een standaard waarde die al in het tekstveld staat."
      />
    </div>
  ),
};

export const WithCharacterCount: Story = {
  render: () => {
    const maxLength = 200;
    return (
      <div className="w-[400px] space-y-2">
        <Label htmlFor="limited">Bericht (max {maxLength} karakters)</Label>
        <Textarea
          id="limited"
          placeholder="Typ hier uw bericht..."
          maxLength={maxLength}
        />
        <p className="text-sm text-muted-foreground text-end">
          0 / {maxLength}
        </p>
      </div>
    );
  },
};

export const WithError: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="error" className="text-destructive">Feedback</Label>
      <Textarea
        id="error"
        placeholder="Geef feedback..."
        className="border-destructive focus-visible:ring-destructive"
      />
      <p className="text-sm text-destructive">
        Feedback moet minimaal 10 karakters bevatten.
      </p>
    </div>
  ),
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <div className="space-y-2">
        <Label>Klein</Label>
        <Textarea placeholder="Klein tekstveld" className="min-h-[60px]" />
      </div>
      <div className="space-y-2">
        <Label>Standaard</Label>
        <Textarea placeholder="Standaard tekstveld" />
      </div>
      <div className="space-y-2">
        <Label>Groot</Label>
        <Textarea placeholder="Groot tekstveld" className="min-h-[150px]" />
      </div>
    </div>
  ),
};

export const ResizeModes: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <div className="space-y-2">
        <Label>Niet aanpasbaar</Label>
        <Textarea placeholder="Kan niet worden aangepast" className="resize-none" />
      </div>
      <div className="space-y-2">
        <Label>Verticaal aanpasbaar</Label>
        <Textarea placeholder="Alleen verticaal aanpasbaar" className="resize-y" />
      </div>
      <div className="space-y-2">
        <Label>Vrij aanpasbaar</Label>
        <Textarea placeholder="Vrij aanpasbaar in alle richtingen" className="resize" />
      </div>
    </div>
  ),
};

export const InForm: Story = {
  render: () => (
    <form className="w-[400px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Onderwerp</Label>
        <input
          id="subject"
          type="text"
          placeholder="Onderwerp van uw bericht"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Bericht</Label>
        <Textarea
          id="body"
          placeholder="Typ hier uw bericht..."
          className="min-h-[120px]"
        />
      </div>
      <Button type="submit" className="w-full">Versturen</Button>
    </form>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="w-[400px] space-y-2 font-arabic">
      <Label htmlFor="arabic">رسالة</Label>
      <Textarea
        id="arabic"
        placeholder="اكتب رسالتك هنا..."
        className="text-right"
      />
      <p className="text-sm text-muted-foreground">
        هذا سيظهر في ملفك الشخصي العام.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Textarea in Right-to-Left (Arabic) context',
      },
    },
  },
};

export const ReadOnly: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="readonly">Alleen lezen</Label>
      <Textarea
        id="readonly"
        readOnly
        value="Dit is alleen-lezen tekst die niet kan worden aangepast door de gebruiker. Het kan wel worden geselecteerd en gekopieerd."
      />
    </div>
  ),
};

export const AccessibilityTest: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="a11y">Toegankelijk tekstveld</Label>
      <Textarea
        id="a11y"
        placeholder="Toegankelijk tekstveld"
        aria-describedby="a11y-description"
        aria-required="true"
      />
      <p id="a11y-description" className="text-sm text-muted-foreground">
        Dit veld is verplicht en ondersteunt screen readers.
      </p>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'label', enabled: true },
        ],
      },
    },
  },
};
