import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
        <CardDescription>This card has no footer</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Just header and content.</p>
      </CardContent>
    </Card>
  ),
};

export const StatCard: Story = {
  render: () => (
    <Card className="w-[250px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">€45,231.89</div>
        <p className="text-xs text-muted-foreground">
          +20.1% from last month
        </p>
      </CardContent>
    </Card>
  ),
};

export const ListCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Recent Students</CardTitle>
        <CardDescription>You have 12 new enrollments this week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { name: 'Ahmed Hassan', status: 'Niveau 2' },
          { name: 'Fatima Al-Zahra', status: 'Niveau 1' },
          { name: 'Omar Khaled', status: 'Niveau 3' },
        ].map((student) => (
          <div key={student.name} className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.status}</p>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  ),
};

export const RTLMode: Story = {
  render: () => (
    <div dir="rtl">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>البطاقة</CardTitle>
          <CardDescription>هذه بطاقة في وضع RTL</CardDescription>
        </CardHeader>
        <CardContent>
          <p>المحتوى هنا.</p>
        </CardContent>
        <CardFooter>
          <Button>إجراء</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card className="w-[350px] hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover to see the shadow effect</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card has hover effects applied.</p>
      </CardContent>
    </Card>
  ),
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
        </CardHeader>
        <CardContent>
          <p>First card</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Second card</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Third card</p>
        </CardContent>
      </Card>
    </div>
  ),
};
