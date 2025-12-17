import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';

const meta: Meta<typeof Collapsible> = {
  title: 'UI/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

const CollapsibleDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-[350px] space-y-2"
    >
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">
          @peduarte starred 3 repositories
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-3 font-mono text-sm">
        @radix-ui/primitives
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @radix-ui/colors
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @stitches/react
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const Default: Story = {
  render: () => <CollapsibleDemo />,
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-[350px] space-y-2">
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">Course Modules</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-3 text-sm">
        Module 1: Introduction
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-3 text-sm">
          Module 2: Arabic Alphabet
        </div>
        <div className="rounded-md border px-4 py-3 text-sm">
          Module 3: Basic Grammar
        </div>
        <div className="rounded-md border px-4 py-3 text-sm">
          Module 4: Conversation
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Nested: Story = {
  render: () => (
    <Collapsible className="w-[400px] space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Level 1: Beginner
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pl-4">
        <Collapsible className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              Unit 1: Alphabet
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-4">
            <div className="rounded-md border px-3 py-2 text-sm">Lesson 1</div>
            <div className="rounded-md border px-3 py-2 text-sm">Lesson 2</div>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              Unit 2: Numbers
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-4">
            <div className="rounded-md border px-3 py-2 text-sm">Lesson 1</div>
            <div className="rounded-md border px-3 py-2 text-sm">Lesson 2</div>
          </CollapsibleContent>
        </Collapsible>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Collapsible defaultOpen className="w-[350px] space-y-2">
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="text-sm font-semibold">الوحدات الدراسية</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-3 text-sm">
          الوحدة الأولى: المقدمة
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-3 text-sm">
            الوحدة الثانية: الأبجدية العربية
          </div>
          <div className="rounded-md border px-4 py-3 text-sm">
            الوحدة الثالثة: القواعد الأساسية
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};
