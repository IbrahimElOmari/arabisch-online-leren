import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, Shield } from 'lucide-react';
import { useCookieConsent, ConsentCategory } from '@/hooks/useCookieConsent';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const CookieConsentBanner = () => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const { 
    hasConsented, 
    categories, 
    acceptAll, 
    acceptEssentialOnly, 
    updateCategory, 
    saveConsent 
  } = useCookieConsent();

  // Don't show if consent already given
  if (hasConsented) return null;

  const handleSaveSettings = () => {
    saveConsent();
    // Force state update
    useCookieConsent.setState({ hasConsented: true, consentDate: new Date().toISOString() });
  };

  const cookieCategories: { key: ConsentCategory; label: string; description: string; required?: boolean }[] = [
    {
      key: 'essential',
      label: t('cookies.essential', 'Essentieel'),
      description: t('cookies.essentialDesc', 'Noodzakelijk voor de werking van de website'),
      required: true,
    },
    {
      key: 'analytics',
      label: t('cookies.analytics', 'Analytics'),
      description: t('cookies.analyticsDesc', 'Helpt ons de website te verbeteren'),
    },
    {
      key: 'marketing',
      label: t('cookies.marketing', 'Marketing'),
      description: t('cookies.marketingDesc', 'Voor gepersonaliseerde advertenties'),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-3 px-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t('cookies.title', 'Cookie Voorkeuren')}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-sm">
              {t('cookies.description', 'Wij gebruiken cookies om je ervaring te verbeteren. Kies welke cookies je accepteert.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            {showSettings && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                {cookieCategories.map((category) => (
                  <div key={category.key} className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor={category.key} className="font-medium text-sm">
                        {category.label}
                        {category.required && (
                          <span className="text-xs text-muted-foreground ms-2">
                            ({t('cookies.required', 'verplicht')})
                          </span>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                    <Switch
                      id={category.key}
                      checked={categories[category.key]}
                      onCheckedChange={(checked) => updateCategory(category.key, checked)}
                      disabled={category.required}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={acceptAll} className="flex-1" size="sm">
                <Shield className="h-4 w-4 me-2" />
                {t('cookies.acceptAll', 'Alles Accepteren')}
              </Button>
              <Button onClick={acceptEssentialOnly} variant="outline" className="flex-1" size="sm">
                {t('cookies.essentialOnly', 'Alleen Essentieel')}
              </Button>
              {!showSettings ? (
                <Button onClick={() => setShowSettings(true)} variant="ghost" size="sm">
                  <Settings className="h-4 w-4 me-2" />
                  {t('cookies.settings', 'Instellingen')}
                </Button>
              ) : (
                <Button onClick={handleSaveSettings} variant="secondary" size="sm">
                  {t('cookies.saveSettings', 'Opslaan')}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t('cookies.privacyLink', 'Lees onze')}{' '}
              <Link to="/privacy" className="underline hover:text-primary">
                {t('cookies.privacyPolicy', 'Privacyverklaring')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
