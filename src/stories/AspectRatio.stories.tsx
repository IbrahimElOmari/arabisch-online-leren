import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const meta: Meta<typeof AspectRatio> = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {
  render: () => (
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9} className="bg-muted">
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-muted-foreground">16:9</span>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-[300px]">
      <AspectRatio ratio={1} className="bg-muted">
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-muted-foreground">1:1</span>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const Portrait: Story = {
  render: () => (
    <div className="w-[200px]">
      <AspectRatio ratio={3 / 4} className="bg-muted">
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-muted-foreground">3:4</span>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const Cinematic: Story = {
  render: () => (
    <div className="w-[500px]">
      <AspectRatio ratio={21 / 9} className="bg-muted">
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-muted-foreground">21:9 Cinematic</span>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const WithImage: Story = {
  render: () => (
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9}>
        <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/60 rounded-lg flex items-center justify-center">
          <span className="text-xl font-semibold text-primary-foreground">
            Course Thumbnail
          </span>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const VideoPlayer: Story = {
  render: () => (
    <div className="w-[600px]">
      <AspectRatio ratio={16 / 9} className="bg-black rounded-lg overflow-hidden">
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2 mx-auto">
              <svg
                className="w-8 h-8 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-sm opacity-70">Click to play video</span>
          </div>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const CourseCard: Story = {
  render: () => (
    <div className="w-[300px] border rounded-lg overflow-hidden">
      <AspectRatio ratio={4 / 3}>
        <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-lg font-bold">Arabic 101</span>
        </div>
      </AspectRatio>
      <div className="p-4">
        <h3 className="font-semibold">Arabic Basics</h3>
        <p className="text-sm text-muted-foreground">Learn the fundamentals</p>
      </div>
    </div>
  ),
};

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-2 w-[600px]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <AspectRatio key={i} ratio={1} className="bg-muted rounded-lg">
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Image {i}</span>
          </div>
        </AspectRatio>
      ))}
    </div>
  ),
};
