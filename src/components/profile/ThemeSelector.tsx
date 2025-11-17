import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Palette, Sparkles, Briefcase, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * PR11: Theme Selector Component
 * Allows users to choose between auto-detection, playful, or professional theme
 */
export const ThemeSelector = () => {
  const { profile } = useAuth();
  const { themeAge, updateThemePreference, isUpdating } = useAgeTheme();
  const { toast } = useToast();

  const currentPreference = profile?.theme_preference || 'auto';

  const handleThemeChange = async (value: string) => {
    try {
      await updateThemePreference(value as 'auto' | 'playful' | 'professional');
      toast({
        title: 'Thema bijgewerkt',
        description: 'Je thema-voorkeur is succesvol opgeslagen.',
      });
    } catch (error) {
      toast({
        title: 'Fout bij opslaan',
        description: 'Er ging iets mis. Probeer het opnieuw.',
        variant: 'destructive',
      });
    }
  };

  const getThemeDescription = () => {
    const age = profile?.age || 0;
    const role = profile?.role;

    if (role && ['leerkracht', 'admin', 'ouder'].includes(role)) {
      return 'Automatisch: Professioneel (op basis van je rol)';
    }

    return age < 16
      ? 'Automatisch: Speels thema (op basis van je leeftijd)'
      : 'Automatisch: Professioneel thema (op basis van je leeftijd)';
  };

  return (
    <Card className={cn(
      "transition-all",
      themeAge === 'playful' && "border-2 border-primary"
    )}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Interface Thema</CardTitle>
        </div>
        <CardDescription>
          Kies hoe je de interface wilt zien. Het thema past de kleuren, vormen en sfeer van de applicatie aan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={currentPreference}
          onValueChange={handleThemeChange}
          disabled={isUpdating}
          className="space-y-3"
        >
          {/* Auto Detection */}
          <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="auto" id="theme-auto" className="mt-1" />
            <div className="flex-1">
              <Label
                htmlFor="theme-auto"
                className="flex items-center gap-2 font-medium cursor-pointer"
              >
                <Wand2 className="h-4 w-4" />
                Automatisch
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {getThemeDescription()}
              </p>
            </div>
          </div>

          {/* Playful Theme */}
          <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="playful" id="theme-playful" className="mt-1" />
            <div className="flex-1">
              <Label
                htmlFor="theme-playful"
                className="flex items-center gap-2 font-medium cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-purple-500" />
                Speels
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Vrolijke kleuren, leuke animaties en een speelse uitstraling. Perfect voor jongere gebruikers.
              </p>
            </div>
          </div>

          {/* Professional Theme */}
          <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="professional" id="theme-professional" className="mt-1" />
            <div className="flex-1">
              <Label
                htmlFor="theme-professional"
                className="flex items-center gap-2 font-medium cursor-pointer"
              >
                <Briefcase className="h-4 w-4 text-blue-600" />
                Professioneel
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Rustige kleuren, strakke lijnen en een serieuze uitstraling. Ideaal voor oudere gebruikers en volwassenen.
              </p>
            </div>
          </div>
        </RadioGroup>

        {/* Current Theme Preview */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Huidig actief thema:</p>
          <div className={cn(
            "p-3 rounded-lg border-2 font-medium",
            themeAge === 'playful'
              ? "bg-purple-50 dark:bg-purple-950/20 border-purple-400 text-purple-700 dark:text-purple-300"
              : "bg-blue-50 dark:bg-blue-950/20 border-blue-400 text-blue-700 dark:text-blue-300"
          )}>
            {themeAge === 'playful' ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Speels Thema
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Professioneel Thema
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
