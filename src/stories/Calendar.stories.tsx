import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { nl, ar } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

const meta: Meta<typeof Calendar> = {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

// Default Calendar
const DefaultCalendarExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
    />
  );
};

export const Default: Story = {
  render: () => <DefaultCalendarExample />,
};

// Range Selection
const RangeCalendarExample = () => {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  return (
    <div className="space-y-4">
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        className="rounded-md border"
        numberOfMonths={2}
      />
      <p className="text-sm text-muted-foreground text-center">
        {range?.from && range?.to
          ? `${format(range.from, 'd MMM yyyy', { locale: nl })} - ${format(range.to, 'd MMM yyyy', { locale: nl })}`
          : 'Selecteer een periode'}
      </p>
    </div>
  );
};

export const RangeSelection: Story = {
  render: () => <RangeCalendarExample />,
};

// Multiple Selection
const MultipleCalendarExample = () => {
  const [dates, setDates] = useState<Date[] | undefined>([
    new Date(),
    addDays(new Date(), 2),
    addDays(new Date(), 5),
  ]);

  return (
    <div className="space-y-4">
      <Calendar
        mode="multiple"
        selected={dates}
        onSelect={setDates}
        className="rounded-md border"
      />
      <p className="text-sm text-muted-foreground text-center">
        {dates?.length || 0} dagen geselecteerd
      </p>
    </div>
  );
};

export const MultipleSelection: Story = {
  render: () => <MultipleCalendarExample />,
};

// With Dutch Locale
const DutchCalendarExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      locale={nl}
      className="rounded-md border"
    />
  );
};

export const DutchLocale: Story = {
  render: () => <DutchCalendarExample />,
};

// With Disabled Dates
const DisabledDatesExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Disable weekends
  const disabledDays = [
    { dayOfWeek: [0, 6] }, // Sunday and Saturday
  ];

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      disabled={disabledDays}
      className="rounded-md border"
    />
  );
};

export const DisabledWeekends: Story = {
  render: () => <DisabledDatesExample />,
};

// With Disabled Past Dates
const DisabledPastExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      disabled={{ before: new Date() }}
      className="rounded-md border"
    />
  );
};

export const DisabledPastDates: Story = {
  render: () => <DisabledPastExample />,
};

// Two Months View
const TwoMonthsExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      numberOfMonths={2}
      className="rounded-md border"
    />
  );
};

export const TwoMonths: Story = {
  render: () => <TwoMonthsExample />,
};

// Without Outside Days
const WithoutOutsideDaysExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      showOutsideDays={false}
      className="rounded-md border"
    />
  );
};

export const WithoutOutsideDays: Story = {
  render: () => <WithoutOutsideDaysExample />,
};

// Fixed Weeks
const FixedWeeksExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      fixedWeeks
      className="rounded-md border"
    />
  );
};

export const FixedWeeks: Story = {
  render: () => <FixedWeeksExample />,
};

// RTL Arabic Calendar
const RTLCalendarExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div dir="rtl">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        locale={ar}
        className="rounded-md border"
      />
    </div>
  );
};

export const RTL: Story = {
  render: () => <RTLCalendarExample />,
  parameters: {
    docs: {
      description: {
        story: 'Calendar in Right-to-Left (Arabic) context with Arabic locale',
      },
    },
  },
};

// With Footer
const WithFooterExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
        footer={
          <p className="text-sm text-muted-foreground text-center pt-2">
            {date ? format(date, 'd MMMM yyyy', { locale: nl }) : 'Selecteer een datum'}
          </p>
        }
      />
    </div>
  );
};

export const WithFooter: Story = {
  render: () => <WithFooterExample />,
};

// Lesson Schedule Example
const LessonScheduleExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Simulated lesson dates
  const lessonDates = [
    addDays(new Date(), 1),
    addDays(new Date(), 3),
    addDays(new Date(), 5),
    addDays(new Date(), 8),
  ];

  const modifiers = {
    lesson: lessonDates,
  };

  const modifiersStyles = {
    lesson: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '50%',
    },
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-md border"
      />
      <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
        <div className="w-4 h-4 rounded-full bg-primary" />
        <span>Lesdagen</span>
      </div>
    </div>
  );
};

export const LessonSchedule: Story = {
  render: () => <LessonScheduleExample />,
};

export const AccessibilityTest: Story = {
  render: () => (
    <Calendar
      mode="single"
      className="rounded-md border"
      aria-label="Selecteer een datum"
    />
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
