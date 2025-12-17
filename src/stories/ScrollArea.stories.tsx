import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const meta: Meta<typeof ScrollArea> = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const tags = Array.from({ length: 50 }).map(
  (_, i) => `Tag ${i + 1}`
);

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

const works = [
  { artist: "Ornette Coleman", art: "The Shape of Jazz to Come" },
  { artist: "Charles Mingus", art: "Mingus Ah Um" },
  { artist: "Miles Davis", art: "Kind of Blue" },
  { artist: "Dave Brubeck", art: "Time Out" },
  { artist: "John Coltrane", art: "Giant Steps" },
  { artist: "Thelonious Monk", art: "Brilliant Corners" },
  { artist: "Art Blakey", art: "Moanin'" },
  { artist: "Bill Evans", art: "Sunday at the Village Vanguard" },
];

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {works.map((work) => (
          <div key={work.art} className="w-[150px] shrink-0">
            <div className="aspect-square rounded-md bg-muted" />
            <div className="mt-2">
              <p className="text-sm font-medium truncate">{work.art}</p>
              <p className="text-xs text-muted-foreground truncate">
                {work.artist}
              </p>
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

const courses = [
  { name: "Arabic Basics Level 1", lessons: 24, duration: "12 weeks" },
  { name: "Arabic Basics Level 2", lessons: 28, duration: "14 weeks" },
  { name: "Intermediate Arabic", lessons: 32, duration: "16 weeks" },
  { name: "Advanced Arabic", lessons: 36, duration: "18 weeks" },
  { name: "Conversational Arabic", lessons: 20, duration: "10 weeks" },
  { name: "Business Arabic", lessons: 16, duration: "8 weeks" },
  { name: "Arabic Grammar Deep Dive", lessons: 40, duration: "20 weeks" },
  { name: "Arabic Calligraphy", lessons: 12, duration: "6 weeks" },
  { name: "Quranic Arabic", lessons: 48, duration: "24 weeks" },
  { name: "Modern Standard Arabic", lessons: 30, duration: "15 weeks" },
];

export const CourseList: Story = {
  render: () => (
    <ScrollArea className="h-72 w-80 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Available Courses</h4>
        {courses.map((course) => (
          <div key={course.name} className="mb-3">
            <div className="text-sm font-medium">{course.name}</div>
            <div className="text-xs text-muted-foreground">
              {course.lessons} lessons • {course.duration}
            </div>
            <Separator className="mt-3" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const ChatMessages: Story = {
  render: () => (
    <ScrollArea className="h-80 w-96 rounded-md border">
      <div className="p-4 space-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`rounded-lg px-3 py-2 max-w-[80%] ${
                i % 2 === 0
                  ? "bg-muted"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <p className="text-sm">
                {i % 2 === 0
                  ? "السلام عليكم، كيف حالك؟"
                  : "وعليكم السلام، الحمد لله بخير"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Both: Story = {
  render: () => (
    <ScrollArea className="h-64 w-64 rounded-md border">
      <div className="p-4" style={{ width: 500 }}>
        <h4 className="mb-4 text-sm font-medium leading-none">
          Scrollable content (both directions)
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="h-20 w-32 rounded-md bg-muted flex items-center justify-center"
            >
              Item {i + 1}
            </div>
          ))}
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <ScrollArea className="h-72 w-80 rounded-md border">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium leading-none">الدورات المتاحة</h4>
          {[
            "أساسيات اللغة العربية",
            "القواعد العربية",
            "المحادثة العربية",
            "الخط العربي",
            "العربية الفصحى",
            "العربية للأعمال",
            "تجويد القرآن",
            "الأدب العربي",
          ].map((course) => (
            <div key={course} className="mb-3">
              <div className="text-sm font-medium">{course}</div>
              <Separator className="mt-3" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};
