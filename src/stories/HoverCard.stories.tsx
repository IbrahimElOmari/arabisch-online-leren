import type { Meta, StoryObj } from '@storybook/react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CalendarDays, GraduationCap, BookOpen } from 'lucide-react';

const meta: Meta<typeof HoverCard> = {
  title: 'UI/HoverCard',
  component: HoverCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <p className="text-sm">
              The React Framework – created and maintained by @vercel.
            </p>
            <div className="flex items-center pt-2">
              <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
              <span className="text-xs text-muted-foreground">
                Joined December 2021
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" className="p-0 h-auto">Ahmed Mohamed</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-semibold">Ahmed Mohamed</h4>
            <p className="text-sm text-muted-foreground">Arabic Teacher</p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center">
                <GraduationCap className="mr-1 h-4 w-4 opacity-70" />
                <span className="text-xs text-muted-foreground">
                  150 Students
                </span>
              </div>
              <div className="flex items-center">
                <BookOpen className="mr-1 h-4 w-4 opacity-70" />
                <span className="text-xs text-muted-foreground">
                  5 Courses
                </span>
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const CoursePreview: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="outline">Arabic Basics</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-96">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Arabic Basics - Level 1</h4>
            <p className="text-sm text-muted-foreground">
              Learn the fundamentals of Arabic language including alphabet, 
              basic grammar, and everyday vocabulary.
            </p>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>12 weeks</span>
            <span>•</span>
            <span>24 lessons</span>
            <span>•</span>
            <span>Beginner</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-lg font-bold text-primary">€299</span>
            <Button size="sm">View Course</Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="link" className="p-0 h-auto">أحمد محمد</Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="flex justify-between space-x-4 space-x-reverse">
            <Avatar className="h-12 w-12">
              <AvatarFallback>أم</AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-semibold">أحمد محمد</h4>
              <p className="text-sm text-muted-foreground">مدرس اللغة العربية</p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center">
                  <GraduationCap className="ml-1 h-4 w-4 opacity-70" />
                  <span className="text-xs text-muted-foreground">
                    150 طالب
                  </span>
                </div>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};
