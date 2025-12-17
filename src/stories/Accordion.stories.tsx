import type { Meta, StoryObj } from '@storybook/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other components' aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Can I open multiple items?</AccordionTrigger>
        <AccordionContent>
          Yes. Just set type="multiple" on the Accordion component.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How does it work?</AccordionTrigger>
        <AccordionContent>
          Each item can be opened independently when using multiple mode.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-1" className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>This is open by default</AccordionTrigger>
        <AccordionContent>
          Use defaultValue to set the initially open item.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>This is closed</AccordionTrigger>
        <AccordionContent>
          Click to open this item.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Accordion type="single" collapsible className="w-[400px]">
        <AccordionItem value="item-1">
          <AccordionTrigger>هل هو متاح؟</AccordionTrigger>
          <AccordionContent>
            نعم. يلتزم بنمط تصميم WAI-ARIA.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>هل هو منسق؟</AccordionTrigger>
          <AccordionContent>
            نعم. يأتي مع أنماط افتراضية تتطابق مع جماليات المكونات الأخرى.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const FAQ: Story = {
  render: () => (
    <div className="w-[500px]">
      <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible>
        <AccordionItem value="q1">
          <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
          <AccordionContent>
            We accept all major credit cards (Visa, MasterCard, American Express), 
            PayPal, and bank transfers for orders over €100.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q2">
          <AccordionTrigger>How long does shipping take?</AccordionTrigger>
          <AccordionContent>
            Standard shipping takes 3-5 business days. Express shipping is available 
            for 1-2 business day delivery.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q3">
          <AccordionTrigger>What is your return policy?</AccordionTrigger>
          <AccordionContent>
            We offer a 30-day return policy for all unused items in original packaging. 
            Contact our support team to initiate a return.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
