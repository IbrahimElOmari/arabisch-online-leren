import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

const meta: Meta = {
  title: 'UI/Toast',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj;

// Default Toast Example
const DefaultToastExample = () => {
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: 'Melding',
          description: 'Dit is een standaard notificatie.',
        });
      }}
    >
      Toon Toast
    </Button>
  );
};

export const Default: Story = {
  render: () => <DefaultToastExample />,
};

// Success Toast
const SuccessToastExample = () => {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: 'Succes!',
          description: 'Uw wijzigingen zijn opgeslagen.',
        });
      }}
    >
      Toon Succes Toast
    </Button>
  );
};

export const Success: Story = {
  render: () => <SuccessToastExample />,
};

// Destructive Toast
const DestructiveToastExample = () => {
  const { toast } = useToast();

  return (
    <Button
      variant="destructive"
      onClick={() => {
        toast({
          variant: 'destructive',
          title: 'Fout!',
          description: 'Er is iets misgegaan. Probeer het opnieuw.',
        });
      }}
    >
      Toon Fout Toast
    </Button>
  );
};

export const Destructive: Story = {
  render: () => <DestructiveToastExample />,
};

// Toast with Action
const ToastWithActionExample = () => {
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: 'Bestand verwijderd',
          description: 'Het bestand is verplaatst naar de prullenbak.',
          action: (
            <ToastAction altText="Ongedaan maken">
              Ongedaan maken
            </ToastAction>
          ),
        });
      }}
    >
      Toon Toast met Actie
    </Button>
  );
};

export const WithAction: Story = {
  render: () => <ToastWithActionExample />,
};

// Toast with Long Description
const LongDescriptionToastExample = () => {
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: 'Nieuwe les beschikbaar',
          description: 'Er is een nieuwe les toegevoegd aan uw cursus "Arabisch voor beginners". De les behandelt de basisgrammatica en bevat interactieve oefeningen.',
        });
      }}
    >
      Toon Lange Toast
    </Button>
  );
};

export const LongDescription: Story = {
  render: () => <LongDescriptionToastExample />,
};

// Multiple Toasts
const MultipleToastsExample = () => {
  const { toast } = useToast();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Eerste melding',
            description: 'Dit is de eerste toast.',
          });
        }}
      >
        Toast 1
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Tweede melding',
            description: 'Dit is de tweede toast.',
          });
        }}
      >
        Toast 2
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Derde melding',
            description: 'Dit is de derde toast.',
          });
        }}
      >
        Toast 3
      </Button>
    </div>
  );
};

export const MultipleToasts: Story = {
  render: () => <MultipleToastsExample />,
};

// Static Toast Components (for visual testing)
export const StaticDefault: Story = {
  render: () => (
    <ToastProvider>
      <Toast className="relative">
        <div className="grid gap-1">
          <ToastTitle>Standaard Toast</ToastTitle>
          <ToastDescription>
            Dit is een voorbeeld van een standaard toast component.
          </ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport className="relative" />
    </ToastProvider>
  ),
};

export const StaticDestructive: Story = {
  render: () => (
    <ToastProvider>
      <Toast variant="destructive" className="relative">
        <div className="grid gap-1">
          <ToastTitle>Fout Toast</ToastTitle>
          <ToastDescription>
            Dit is een voorbeeld van een destructive toast component.
          </ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport className="relative" />
    </ToastProvider>
  ),
};

export const StaticWithAction: Story = {
  render: () => (
    <ToastProvider>
      <Toast className="relative">
        <div className="grid gap-1">
          <ToastTitle>Met Actie</ToastTitle>
          <ToastDescription>
            Toast met een actieknop.
          </ToastDescription>
        </div>
        <ToastAction altText="Ongedaan maken">Herstel</ToastAction>
        <ToastClose />
      </Toast>
      <ToastViewport className="relative" />
    </ToastProvider>
  ),
};

// RTL Toast
const RTLToastExample = () => {
  const { toast } = useToast();

  return (
    <div dir="rtl">
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'إشعار',
            description: 'هذا هو إشعار باللغة العربية.',
          });
        }}
      >
        عرض الإشعار
      </Button>
    </div>
  );
};

export const RTL: Story = {
  render: () => <RTLToastExample />,
  parameters: {
    docs: {
      description: {
        story: 'Toast notification in Right-to-Left (Arabic) context',
      },
    },
  },
};

// Accessibility Test
export const AccessibilityTest: Story = {
  render: () => (
    <ToastProvider>
      <Toast className="relative" role="alert" aria-live="assertive" aria-atomic="true">
        <div className="grid gap-1">
          <ToastTitle>Toegankelijke Toast</ToastTitle>
          <ToastDescription>
            Deze toast is geoptimaliseerd voor screenreaders.
          </ToastDescription>
        </div>
        <ToastClose aria-label="Sluit melding" />
      </Toast>
      <ToastViewport className="relative" />
    </ToastProvider>
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
