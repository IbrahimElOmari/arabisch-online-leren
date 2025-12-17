import type { Meta, StoryObj } from '@storybook/react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const meta: Meta<typeof Drawer> = {
  title: 'UI/Drawer',
  component: Drawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>
            Make changes to your profile here. Click save when you're done.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 pb-0">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button>Save changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const CourseEnrollment: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Enroll Now</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Arabic Language Course</DrawerTitle>
            <DrawerDescription>
              Beginner level - 12 weeks program
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">12 weeks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classes</span>
                <span className="font-medium">24 sessions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium text-primary">€299</span>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button className="w-full">Confirm Enrollment</Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Maybe Later</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ),
};

export const MobileNavigation: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Navigation</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            Home
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Courses
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            My Progress
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Forum
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Settings
          </Button>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">فتح القائمة</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>تعديل الملف الشخصي</DrawerTitle>
            <DrawerDescription>
              قم بإجراء التغييرات على ملفك الشخصي هنا.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name-rtl">الاسم</Label>
                <Input id="name-rtl" placeholder="أدخل اسمك" />
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button>حفظ التغييرات</Button>
            <DrawerClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
