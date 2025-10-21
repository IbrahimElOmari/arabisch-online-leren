import { Card, CardContent } from '@/components/ui/card';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useTranslation } from '@/contexts/TranslationContext';

const Visie = () => {
  const { getTextAlign } = useRTLLayout();
  const { getNavigationAttributes } = useAccessibilityRTL();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background" {...getNavigationAttributes()}>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className={getTextAlign('center')}>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              {t('vision.title') || 'Onze Visie'}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {t('vision.subtitle') || 'Een brug naar culturele verbinding en identiteit'}
            </p>
          </div>
        </div>
      </section>

      {/* Vision Content */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="p-8">
              <div className={`space-y-6 text-lg text-muted-foreground leading-relaxed ${getTextAlign()}`}>
                <p>
                  {t('vision.content.paragraph1') || 'Stel je voor: een generatie jongeren die zelfverzekerd schakelt tussen de bruisende Europese steden en de diepe rijkdom van Arabische verhalen. Ons platform is een online kompas dat jongeren en gezinnen begeleidt om trots hun wortels te ontdekken. We bieden kwalitatief Arabisch onderwijs dat verder gaat dan taal alleen – het is een brug naar culturele verbinding, historische ontdekkingen en het verdiepen van een islamitische identiteit.'}
                </p>
                <p>
                  {t('vision.content.paragraph2') || 'Voor ouders is ons platform een geruststellend antwoord op de uitdaging om erfgoed levend te houden in een digitale wereld. Voor jongeren is Arabisch leren een sleutel tot werelden vol poëzie, geschiedenis en religieuze bronnen zoals de Koran. In onze gemeenschap wordt iedere vraag verwelkomd; van soera\'s tot soefi-dichters, van identiteit tot integratie.'}
                </p>
                <p>
                  {t('vision.content.paragraph3') || 'Wij geloven in een toekomst waarin culturele diversiteit Europa verrijkt. Jouw achtergrond is geen grens, maar een brug – wij geven je de taal om hem over te steken.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Visie;
