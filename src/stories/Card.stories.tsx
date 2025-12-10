import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Trophy, Users, Star, ArrowRight } from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Kaart Titel</CardTitle>
        <CardDescription>Kaart beschrijving tekst</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Dit is de inhoud van de kaart.</p>
      </CardContent>
      <CardFooter>
        <Button>Actie</Button>
      </CardFooter>
    </Card>
  ),
};

export const LessonCard: Story = {
  render: () => (
    <Card className="w-[350px] overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-primary to-primary/70" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">Module 1</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>45 min</span>
          </div>
        </div>
        <CardTitle className="mt-2">Arabisch Alfabet</CardTitle>
        <CardDescription>
          Leer de 28 letters van het Arabische alfabet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Voortgang</span>
            <span className="font-medium">65%</span>
          </div>
          <Progress value={65} />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          Doorgaan
          <ArrowRight className="ms-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-[200px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Punten</CardTitle>
        <Trophy className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">1,234</div>
        <p className="text-xs text-muted-foreground">
          +20% sinds vorige week
        </p>
      </CardContent>
    </Card>
  ),
};

export const CourseCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Arabisch voor Beginners</CardTitle>
            <CardDescription>12 weken cursus</CardDescription>
          </div>
          <Badge>Nieuw</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>24 lessen</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>156 studenten</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= 4 ? 'fill-warning text-warning' : 'text-muted'
              }`}
            />
          ))}
          <span className="ms-1 text-sm text-muted-foreground">(4.2)</span>
        </div>
        <p className="text-sm">
          Ontdek de schoonheid van de Arabische taal met deze complete beginnerscursus.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-2xl font-bold">€149</div>
        <Button>Inschrijven</Button>
      </CardFooter>
    </Card>
  ),
};

export const AchievementCard: Story = {
  render: () => (
    <Card className="w-[300px] border-2 border-warning/50 bg-warning/5">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
          <Trophy className="h-8 w-8 text-warning" />
        </div>
        <CardTitle className="mt-4">Eerste Les Voltooid!</CardTitle>
        <CardDescription>
          Je hebt je eerste Arabische les afgerond
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Badge variant="secondary" className="text-lg">+50 XP</Badge>
      </CardContent>
    </Card>
  ),
};

export const ProfileCard: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardHeader className="text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">AK</span>
        </div>
        <CardTitle className="mt-4">Ahmed Khalil</CardTitle>
        <CardDescription>Student sinds januari 2024</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground">Lessen</div>
          </div>
          <div>
            <div className="text-2xl font-bold">890</div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>
          <div>
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-muted-foreground">Badges</div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">Profiel Bekijken</Button>
      </CardFooter>
    </Card>
  ),
};

export const RTL: Story = {
  render: () => (
    <Card className="w-[350px]" dir="rtl">
      <CardHeader>
        <CardTitle>الدرس الأول</CardTitle>
        <CardDescription>تعلم الحروف العربية</CardDescription>
      </CardHeader>
      <CardContent>
        <p>محتوى البطاقة بالعربية</p>
      </CardContent>
      <CardFooter>
        <Button>ابدأ الآن</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card in Right-to-Left (Arabic) context',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => (
    <Card className="w-[350px] cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <CardTitle>Klikbare Kaart</CardTitle>
        <CardDescription>Hover om het effect te zien</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Deze kaart heeft hover interactie</p>
      </CardContent>
    </Card>
  ),
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Lessen Voltooid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Totale XP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,890</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">7 dagen</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Rang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">#15</div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </CardFooter>
    </Card>
  ),
};
