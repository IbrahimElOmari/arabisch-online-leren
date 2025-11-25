import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Label } from './label';
import { Mail, Lock, Search, User } from 'lucide-react';

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
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Email: Story = {
  render: () => (
    <div className="w-[350px] space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="m@example.com" />
    </div>
  ),
};

export const Password: Story = {
  render: () => (
    <div className="w-[350px] space-y-2">
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" placeholder="Enter your password" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="email" placeholder="Email" className="pl-10" />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="password" placeholder="Password" className="pl-10" />
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Search..." className="pl-10" />
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const WithError: Story = {
  render: () => (
    <div className="w-[350px] space-y-2">
      <Label htmlFor="error-input">Email</Label>
      <Input
        id="error-input"
        type="email"
        placeholder="m@example.com"
        className="border-destructive"
        aria-invalid="true"
      />
      <p className="text-sm text-destructive">Please enter a valid email address.</p>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <Input placeholder="Default size" />
      <Input placeholder="Small" className="h-8 text-sm" />
      <Input placeholder="Large" className="h-12 text-lg" />
    </div>
  ),
};

export const RTLMode: Story = {
  render: () => (
    <div dir="rtl" className="w-[350px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rtl-name">الاسم</Label>
        <Input id="rtl-name" type="text" placeholder="أدخل اسمك" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rtl-email">البريد الإلكتروني</Label>
        <Input id="rtl-email" type="email" placeholder="example@mail.com" />
      </div>
      <div className="relative">
        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="text" placeholder="اسم المستخدم" className="pr-10" dir="rtl" />
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="w-[350px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-name">Full Name</Label>
        <Input id="form-name" type="text" placeholder="John Doe" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-email">Email</Label>
        <Input id="form-email" type="email" placeholder="john@example.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-phone">Phone</Label>
        <Input id="form-phone" type="tel" placeholder="+31 6 12345678" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-message">Message</Label>
        <Input id="form-message" type="text" placeholder="Your message..." />
      </div>
    </form>
  ),
};
