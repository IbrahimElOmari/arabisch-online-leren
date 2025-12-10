import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, LogOut, FileX } from 'lucide-react';

const meta: Meta = {
  title: 'UI/AlertDialog',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Open dialoog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Weet u het zeker?</AlertDialogTitle>
          <AlertDialogDescription>
            Deze actie kan niet ongedaan worden gemaakt. Dit zal permanent uw
            gegevens van onze servers verwijderen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction>Doorgaan</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const DeleteConfirmation: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="me-2 h-4 w-4" />
          Verwijderen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Les verwijderen
          </AlertDialogTitle>
          <AlertDialogDescription>
            Weet u zeker dat u deze les wilt verwijderen? Alle bijbehorende
            oefeningen, voortgang van studenten en materialen worden ook
            verwijderd. Deze actie kan niet ongedaan worden gemaakt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Ja, verwijderen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const LogoutConfirmation: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost">
          <LogOut className="me-2 h-4 w-4" />
          Uitloggen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Uitloggen</AlertDialogTitle>
          <AlertDialogDescription>
            Weet u zeker dat u wilt uitloggen? Niet-opgeslagen wijzigingen
            kunnen verloren gaan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Toch blijven</AlertDialogCancel>
          <AlertDialogAction>Uitloggen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const UnsavedChanges: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Pagina verlaten</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Niet-opgeslagen wijzigingen
          </AlertDialogTitle>
          <AlertDialogDescription>
            U heeft wijzigingen die nog niet zijn opgeslagen. Als u nu weggaat,
            gaan deze wijzigingen verloren.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:flex-row-reverse">
          <AlertDialogAction>Wijzigingen opslaan</AlertDialogAction>
          <AlertDialogCancel>Wijzigingen negeren</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const DestructiveAction: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Account verwijderen</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Account permanent verwijderen
          </AlertDialogTitle>
          <AlertDialogDescription>
            Dit zal uw account en al uw gegevens permanent verwijderen,
            inclusief:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Alle lesvoortgang en certificaten</li>
              <li>Uw profiel en instellingen</li>
              <li>Alle berichten en forumactiviteit</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Account verwijderen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const CancelEnrollment: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Inschrijving annuleren</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileX className="h-5 w-5" />
            Inschrijving annuleren
          </AlertDialogTitle>
          <AlertDialogDescription>
            Weet u zeker dat u uw inschrijving voor "Arabisch voor Beginners"
            wilt annuleren? Uw voortgang wordt bewaard voor het geval u zich
            opnieuw wilt inschrijven.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Ingeschreven blijven</AlertDialogCancel>
          <AlertDialogAction>Annuleren</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="font-arabic">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">فتح الحوار</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف بياناتك بشكل دائم
              من خوادمنا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction>متابعة</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alert dialog in Right-to-Left (Arabic) context',
      },
    },
  },
};

export const CustomStyling: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Premium Upgrade</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-primary">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-primary">
            🎉 Upgrade naar Premium
          </AlertDialogTitle>
          <AlertDialogDescription>
            Krijg toegang tot alle premium lessen, exclusieve content en
            persoonlijke begeleiding van onze docenten.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Inbegrepen:</p>
          <ul className="mt-2 text-sm text-muted-foreground space-y-1">
            <li>✓ Onbeperkte toegang tot alle modules</li>
            <li>✓ Persoonlijke feedback van docenten</li>
            <li>✓ Downloadbaar studiemateriaal</li>
            <li>✓ Certificaten bij voltooiing</li>
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Later beslissen</AlertDialogCancel>
          <AlertDialogAction className="bg-primary">
            Nu upgraden
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const AccessibilityTest: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" aria-label="Open bevestigingsdialoog">
          Open dialoog
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent role="alertdialog" aria-labelledby="alert-title" aria-describedby="alert-desc">
        <AlertDialogHeader>
          <AlertDialogTitle id="alert-title">Bevestiging vereist</AlertDialogTitle>
          <AlertDialogDescription id="alert-desc">
            Dit is een toegankelijke alert dialoog met correcte ARIA attributen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction>Bevestigen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'button-name', enabled: true },
          { id: 'aria-dialog-name', enabled: true },
        ],
      },
    },
  },
};
