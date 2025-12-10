import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const meta: Meta = {
  title: 'UI/Form',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Basic form schema
const basicSchema = z.object({
  username: z.string().min(2, 'Gebruikersnaam moet minimaal 2 karakters zijn'),
  email: z.string().email('Ongeldig e-mailadres'),
});

// Login form schema
const loginSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 karakters zijn'),
  rememberMe: z.boolean().optional(),
});

// Contact form schema
const contactSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  message: z.string().min(10, 'Bericht moet minimaal 10 karakters zijn'),
});

// Basic Form Component
const BasicFormExample = () => {
  const form = useForm<z.infer<typeof basicSchema>>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  });

  const onSubmit = (data: z.infer<typeof basicSchema>) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-[350px] space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gebruikersnaam</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                Dit is je openbare weergavenaam.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Opslaan</Button>
      </form>
    </Form>
  );
};

export const Default: Story = {
  render: () => <BasicFormExample />,
};

// Login Form Component
const LoginFormExample = () => {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  return (
    <Form {...form}>
      <form className="w-[350px] space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mailadres</FormLabel>
              <FormControl>
                <Input type="email" placeholder="naam@voorbeeld.nl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wachtwoord</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Onthoud mij</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Inloggen</Button>
      </form>
    </Form>
  );
};

export const LoginForm: Story = {
  render: () => <LoginFormExample />,
};

// Contact Form Component
const ContactFormExample = () => {
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  return (
    <Form {...form}>
      <form className="w-[400px] space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Naam</FormLabel>
              <FormControl>
                <Input placeholder="Uw volledige naam" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="uw@email.nl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bericht</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Typ hier uw bericht..."
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Minimaal 10 karakters vereist.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Versturen</Button>
      </form>
    </Form>
  );
};

export const ContactForm: Story = {
  render: () => <ContactFormExample />,
};

// Form with Validation Errors
const FormWithErrorsExample = () => {
  const form = useForm<z.infer<typeof basicSchema>>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      username: 'a',
      email: 'invalid-email',
    },
  });

  // Trigger validation on mount
  React.useEffect(() => {
    form.trigger();
  }, [form]);

  return (
    <Form {...form}>
      <form className="w-[350px] space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gebruikersnaam</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Opslaan</Button>
      </form>
    </Form>
  );
};

import React from 'react';

export const WithValidationErrors: Story = {
  render: () => <FormWithErrorsExample />,
};

// RTL Form
const RTLFormExample = () => {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    },
  });

  return (
    <div dir="rtl" className="font-arabic">
      <Form {...form}>
        <form className="w-[350px] space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل اسمك" {...field} />
                </FormControl>
                <FormDescription>
                  هذا هو اسمك الكامل.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="example@domain.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">حفظ</Button>
        </form>
      </Form>
    </div>
  );
};

export const RTL: Story = {
  render: () => <RTLFormExample />,
  parameters: {
    docs: {
      description: {
        story: 'Form in Right-to-Left (Arabic) context with RTL support',
      },
    },
  },
};

// Disabled Form
const DisabledFormExample = () => {
  const form = useForm({
    defaultValues: {
      username: 'johndoe',
      email: 'john@example.com',
    },
  });

  return (
    <Form {...form}>
      <form className="w-[350px] space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gebruikersnaam</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormDescription>
                Dit veld is uitgeschakeld.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled>Opslaan</Button>
      </form>
    </Form>
  );
};

export const Disabled: Story = {
  render: () => <DisabledFormExample />,
};

// Accessibility Test
export const AccessibilityTest: Story = {
  render: () => <BasicFormExample />,
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
