import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => <Label>Standaard label</Label>,
};

export const WithInput: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="email">E-mailadres</Label>
      <Input id="email" type="email" placeholder="naam@voorbeeld.nl" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="required-field">
        Verplicht veld <span className="text-destructive">*</span>
      </Label>
      <Input id="required-field" required />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="username">Gebruikersnaam</Label>
      <Input id="username" placeholder="johndoe" />
      <p className="text-sm text-muted-foreground">
        Dit is uw openbare weergavenaam.
      </p>
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Ik ga akkoord met de voorwaarden</Label>
    </div>
  ),
};

export const WithRadioGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <Label>Kies uw niveau</Label>
      <RadioGroup defaultValue="beginner">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="beginner" id="beginner" />
          <Label htmlFor="beginner">Beginner</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="intermediate" id="intermediate" />
          <Label htmlFor="intermediate">Intermediair</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="advanced" id="advanced" />
          <Label htmlFor="advanced">Gevorderd</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="disabled" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Uitgeschakeld veld
      </Label>
      <Input id="disabled" disabled placeholder="Dit veld is uitgeschakeld" />
    </div>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="error" className="text-destructive">
        E-mailadres
      </Label>
      <Input 
        id="error" 
        type="email" 
        className="border-destructive" 
        defaultValue="ongeldig-email"
      />
      <p className="text-sm text-destructive">
        Voer een geldig e-mailadres in.
      </p>
    </div>
  ),
};

export const MultipleLabels: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <div className="space-y-2">
        <Label htmlFor="firstname">Voornaam</Label>
        <Input id="firstname" placeholder="Jan" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastname">Achternaam</Label>
        <Input id="lastname" placeholder="Jansen" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-multi">E-mailadres</Label>
        <Input id="email-multi" type="email" placeholder="jan@voorbeeld.nl" />
      </div>
    </div>
  ),
};

export const OptionalLabel: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="optional">
        Telefoonnummer <span className="text-muted-foreground">(optioneel)</span>
      </Label>
      <Input id="optional" type="tel" placeholder="+31 6 12345678" />
    </div>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="w-[300px] space-y-2 font-arabic">
      <Label htmlFor="arabic-email">البريد الإلكتروني</Label>
      <Input id="arabic-email" type="email" placeholder="example@domain.com" />
      <p className="text-sm text-muted-foreground">
        هذا هو عنوان بريدك الإلكتروني.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Label in Right-to-Left (Arabic) context',
      },
    },
  },
};

export const InlineLabel: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Label htmlFor="inline-input" className="min-w-[100px]">
        Zoekopdracht:
      </Label>
      <Input id="inline-input" placeholder="Zoeken..." className="flex-1" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="icon-input" className="flex items-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        E-mailadres
      </Label>
      <Input id="icon-input" type="email" placeholder="naam@voorbeeld.nl" />
    </div>
  ),
};

export const AccessibilityTest: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="a11y-input">Toegankelijk label</Label>
      <Input
        id="a11y-input"
        aria-describedby="a11y-description"
        aria-required="true"
      />
      <p id="a11y-description" className="text-sm text-muted-foreground">
        Dit veld is correct gekoppeld aan het label.
      </p>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'label', enabled: true },
          { id: 'form-field-multiple-labels', enabled: true },
        ],
      },
    },
  },
};
