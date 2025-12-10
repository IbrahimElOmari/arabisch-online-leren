import type { Meta, StoryObj } from '@storybook/react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Mail,
  MessageSquare,
  PlusCircle,
  Star,
  BookOpen,
  GraduationCap,
  FileText,
  Search,
} from 'lucide-react';

const meta: Meta = {
  title: 'UI/Command',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[400px]">
      <CommandInput placeholder="Typ een commando of zoek..." />
      <CommandList>
        <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
        <CommandGroup heading="Suggesties">
          <CommandItem>
            <Calendar className="me-2 h-4 w-4" />
            <span>Kalender</span>
          </CommandItem>
          <CommandItem>
            <Smile className="me-2 h-4 w-4" />
            <span>Zoek Emoji</span>
          </CommandItem>
          <CommandItem>
            <Calculator className="me-2 h-4 w-4" />
            <span>Rekenmachine</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Instellingen">
          <CommandItem>
            <User className="me-2 h-4 w-4" />
            <span>Profiel</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard className="me-2 h-4 w-4" />
            <span>Facturatie</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="me-2 h-4 w-4" />
            <span>Instellingen</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-[300px] justify-between"
        >
          <span className="text-muted-foreground">Zoeken...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Typ een commando of zoek..." />
          <CommandList>
            <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
            <CommandGroup heading="Links">
              <CommandItem onSelect={() => setOpen(false)}>
                <Calendar className="me-2 h-4 w-4" />
                <span>Kalender</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Mail className="me-2 h-4 w-4" />
                <span>E-mail</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <MessageSquare className="me-2 h-4 w-4" />
                <span>Berichten</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Instellingen">
              <CommandItem onSelect={() => setOpen(false)}>
                <User className="me-2 h-4 w-4" />
                <span>Profiel</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Settings className="me-2 h-4 w-4" />
                <span>Instellingen</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};

export const LearningPlatform: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[450px]">
      <CommandInput placeholder="Zoek lessen, modules of studenten..." />
      <CommandList>
        <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
        <CommandGroup heading="Recente Lessen">
          <CommandItem>
            <BookOpen className="me-2 h-4 w-4" />
            <span>Arabische Grammatica - Les 5</span>
          </CommandItem>
          <CommandItem>
            <BookOpen className="me-2 h-4 w-4" />
            <span>Vocabulaire Uitbreiding</span>
          </CommandItem>
          <CommandItem>
            <BookOpen className="me-2 h-4 w-4" />
            <span>Conversatie Oefeningen</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Modules">
          <CommandItem>
            <GraduationCap className="me-2 h-4 w-4" />
            <span>Beginners Module</span>
            <CommandShortcut>12 lessen</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <GraduationCap className="me-2 h-4 w-4" />
            <span>Intermediair Module</span>
            <CommandShortcut>18 lessen</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <GraduationCap className="me-2 h-4 w-4" />
            <span>Gevorderd Module</span>
            <CommandShortcut>24 lessen</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Snelle Acties">
          <CommandItem>
            <PlusCircle className="me-2 h-4 w-4" />
            <span>Nieuwe Les Maken</span>
          </CommandItem>
          <CommandItem>
            <Star className="me-2 h-4 w-4" />
            <span>Favorieten Bekijken</span>
          </CommandItem>
          <CommandItem>
            <FileText className="me-2 h-4 w-4" />
            <span>Rapporten Genereren</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const SearchResults: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[400px]">
      <CommandInput placeholder="Zoek studenten..." defaultValue="Ahmed" />
      <CommandList>
        <CommandGroup heading="Studenten (3 resultaten)">
          <CommandItem>
            <User className="me-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Ahmed Al-Rashid</span>
              <span className="text-xs text-muted-foreground">Gevorderd niveau</span>
            </div>
          </CommandItem>
          <CommandItem>
            <User className="me-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Ahmed Hassan</span>
              <span className="text-xs text-muted-foreground">Beginner niveau</span>
            </div>
          </CommandItem>
          <CommandItem>
            <User className="me-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Ahmed Ibrahim</span>
              <span className="text-xs text-muted-foreground">Intermediair niveau</span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Empty: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[400px]">
      <CommandInput placeholder="Zoeken..." defaultValue="xyz123" />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <Search className="h-10 w-10 text-muted-foreground" />
            <p>Geen resultaten gevonden voor "xyz123"</p>
            <p className="text-sm text-muted-foreground">
              Probeer een andere zoekterm.
            </p>
          </div>
        </CommandEmpty>
      </CommandList>
    </Command>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="font-arabic">
      <Command className="rounded-lg border shadow-md w-[400px]">
        <CommandInput placeholder="اكتب أمرًا أو ابحث..." />
        <CommandList>
          <CommandEmpty>لم يتم العثور على نتائج.</CommandEmpty>
          <CommandGroup heading="الاقتراحات">
            <CommandItem>
              <Calendar className="ms-2 h-4 w-4" />
              <span>التقويم</span>
            </CommandItem>
            <CommandItem>
              <BookOpen className="ms-2 h-4 w-4" />
              <span>الدروس</span>
            </CommandItem>
            <CommandItem>
              <User className="ms-2 h-4 w-4" />
              <span>الطلاب</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="الإعدادات">
            <CommandItem>
              <Settings className="ms-2 h-4 w-4" />
              <span>الإعدادات</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Command palette in Right-to-Left (Arabic) context',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[400px]">
      <CommandInput placeholder="Zoeken..." />
      <CommandList>
        <CommandGroup heading="Opties">
          <CommandItem>
            <Calendar className="me-2 h-4 w-4" />
            <span>Beschikbare optie</span>
          </CommandItem>
          <CommandItem disabled>
            <Settings className="me-2 h-4 w-4" />
            <span>Uitgeschakelde optie</span>
          </CommandItem>
          <CommandItem>
            <User className="me-2 h-4 w-4" />
            <span>Nog een beschikbare optie</span>
          </CommandItem>
          <CommandItem disabled>
            <CreditCard className="me-2 h-4 w-4" />
            <span>Ook uitgeschakeld</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const AccessibilityTest: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[400px]" aria-label="Commando palette">
      <CommandInput placeholder="Zoeken..." aria-label="Zoek commando's" />
      <CommandList aria-label="Beschikbare commando's">
        <CommandEmpty>Geen resultaten.</CommandEmpty>
        <CommandGroup heading="Navigatie">
          <CommandItem>
            <Calendar className="me-2 h-4 w-4" aria-hidden="true" />
            <span>Kalender</span>
          </CommandItem>
          <CommandItem>
            <User className="me-2 h-4 w-4" aria-hidden="true" />
            <span>Profiel</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'aria-input-field-name', enabled: true },
        ],
      },
    },
  },
};
