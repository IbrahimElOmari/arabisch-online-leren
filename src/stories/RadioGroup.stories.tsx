import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-1" id="option-1" />
        <Label htmlFor="option-1">Optie 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-2" id="option-2" />
        <Label htmlFor="option-2">Optie 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-3" id="option-3" />
        <Label htmlFor="option-3">Optie 3</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="default" id="r1" className="mt-1" />
        <div>
          <Label htmlFor="r1">Standaard</Label>
          <p className="text-sm text-muted-foreground">
            De standaard weergave met alle functies.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="comfortable" id="r2" className="mt-1" />
        <div>
          <Label htmlFor="r2">Comfortabel</Label>
          <p className="text-sm text-muted-foreground">
            Meer ruimte tussen elementen voor een rustige weergave.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="compact" id="r3" className="mt-1" />
        <div>
          <Label htmlFor="r3">Compact</Label>
          <p className="text-sm text-muted-foreground">
            Meer content in minder ruimte.
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};

export const LevelSelection: Story = {
  render: () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Kies uw niveau</Label>
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
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="expert" id="expert" />
          <Label htmlFor="expert">Expert</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const PaymentMethod: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <Label className="text-base font-medium">Betaalmethode</Label>
      <RadioGroup defaultValue="ideal">
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ideal" id="ideal" />
            <Label htmlFor="ideal">iDEAL</Label>
          </div>
          <span className="text-sm text-muted-foreground">Nederland</span>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="creditcard" id="creditcard" />
            <Label htmlFor="creditcard">Creditcard</Label>
          </div>
          <span className="text-sm text-muted-foreground">Visa, Mastercard</span>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="paypal" id="paypal" />
            <Label htmlFor="paypal">PayPal</Label>
          </div>
          <span className="text-sm text-muted-foreground">Internationaal</span>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Geslacht</Label>
      <RadioGroup defaultValue="male" className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="male" id="male" />
          <Label htmlFor="male">Man</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="female" id="female" />
          <Label htmlFor="female">Vrouw</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="other" id="other" />
          <Label htmlFor="other">Anders</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('option-1');

    return (
      <div className="space-y-4">
        <RadioGroup value={value} onValueChange={setValue}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-1" id="c1" />
            <Label htmlFor="c1">Optie 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-2" id="c2" />
            <Label htmlFor="c2">Optie 2</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-3" id="c3" />
            <Label htmlFor="c3">Optie 3</Label>
          </div>
        </RadioGroup>
        <p className="text-sm text-muted-foreground">
          Geselecteerde waarde: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-1" id="d1" />
        <Label htmlFor="d1">Beschikbaar</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-2" id="d2" disabled />
        <Label htmlFor="d2" className="text-muted-foreground">Uitgeschakeld</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-3" id="d3" />
        <Label htmlFor="d3">Beschikbaar</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithCards: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <Label className="text-base font-medium">Abonnement kiezen</Label>
      <RadioGroup defaultValue="monthly">
        <label
          htmlFor="monthly"
          className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
        >
          <div className="space-y-1">
            <div className="font-medium">Maandelijks</div>
            <div className="text-sm text-muted-foreground">€9,99 per maand</div>
          </div>
          <RadioGroupItem value="monthly" id="monthly" />
        </label>
        <label
          htmlFor="yearly"
          className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
        >
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              Jaarlijks
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                Bespaar 20%
              </span>
            </div>
            <div className="text-sm text-muted-foreground">€95,99 per jaar</div>
          </div>
          <RadioGroupItem value="yearly" id="yearly" />
        </label>
        <label
          htmlFor="lifetime"
          className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
        >
          <div className="space-y-1">
            <div className="font-medium">Levenslang</div>
            <div className="text-sm text-muted-foreground">€299,99 eenmalig</div>
          </div>
          <RadioGroupItem value="lifetime" id="lifetime" />
        </label>
      </RadioGroup>
    </div>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="space-y-4 font-arabic">
      <Label className="text-base font-medium">اختر مستواك</Label>
      <RadioGroup defaultValue="beginner">
        <div className="flex items-center space-x-reverse space-x-2">
          <RadioGroupItem value="beginner" id="rtl-beginner" />
          <Label htmlFor="rtl-beginner">مبتدئ</Label>
        </div>
        <div className="flex items-center space-x-reverse space-x-2">
          <RadioGroupItem value="intermediate" id="rtl-intermediate" />
          <Label htmlFor="rtl-intermediate">متوسط</Label>
        </div>
        <div className="flex items-center space-x-reverse space-x-2">
          <RadioGroupItem value="advanced" id="rtl-advanced" />
          <Label htmlFor="rtl-advanced">متقدم</Label>
        </div>
      </RadioGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio group in Right-to-Left (Arabic) context',
      },
    },
  },
};

export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-4">
      <Label id="radio-label" className="text-base font-medium">
        Toegankelijke radio groep
      </Label>
      <RadioGroup 
        defaultValue="option-1" 
        aria-labelledby="radio-label"
        aria-describedby="radio-description"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option-1" id="a11y-1" />
          <Label htmlFor="a11y-1">Optie 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option-2" id="a11y-2" />
          <Label htmlFor="a11y-2">Optie 2</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option-3" id="a11y-3" />
          <Label htmlFor="a11y-3">Optie 3</Label>
        </div>
      </RadioGroup>
      <p id="radio-description" className="text-sm text-muted-foreground">
        Kies een van de bovenstaande opties.
      </p>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'radiogroup', enabled: true },
        ],
      },
    },
  },
};
