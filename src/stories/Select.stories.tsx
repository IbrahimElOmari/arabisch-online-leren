import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Selecteer een optie" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Optie 1</SelectItem>
        <SelectItem value="option2">Optie 2</SelectItem>
        <SelectItem value="option3">Optie 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithDisabledOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Kies je niveau" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a1">A1 - Beginner</SelectItem>
        <SelectItem value="a2">A2 - Elementair</SelectItem>
        <SelectItem value="b1" disabled>B1 - Intermediate (Binnenkort)</SelectItem>
        <SelectItem value="b2" disabled>B2 - Gevorderd (Binnenkort)</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Selecteer een module" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="grammar">Grammatica</SelectItem>
        <SelectItem value="vocab">Vocabulaire</SelectItem>
        <SelectItem value="reading">Lezen</SelectItem>
        <SelectItem value="writing">Schrijven</SelectItem>
      </SelectContent>
    </Select>
  ),
};
