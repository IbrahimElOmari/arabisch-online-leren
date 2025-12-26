import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock } from 'lucide-react';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

const plans = [
  {
    name: 'Per Klas',
    description: 'Eenmalige betaling voor toegang tot een specifieke klas',
    price: '€49',
    period: 'eenmalig',
    features: [
      'Toegang tot alle lessen van de klas',
      'Huiswerk en opdrachten',
      'Forum toegang',
      'Voortgang tracking',
      'Certificaat bij voltooiing'
    ],
    popular: false
  },
  {
    name: 'Maandelijks',
    description: 'Toegang tot alle klassen per maand',
    price: '€29',
    period: 'per maand',
    features: [
      'Toegang tot alle klassen',
      'Onbeperkte lessen',
      'Prioriteit support',
      'Geavanceerde voortgang analytics',
      'Alle toekomstige content'
    ],
    popular: true
  },
  {
    name: 'Jaarlijks',
    description: 'Beste waarde voor langdurige toegang',
    price: '€199',
    period: 'per jaar',
    originalPrice: '€348',
    features: [
      'Alle maandelijke voordelen',
      '43% korting t.o.v. maandelijks',
      'Exclusieve jaarlijkse content',
      'Persoonlijke begeleiding',
      'Certificaten voor alle klassen'
    ],
    popular: false
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const { getFlexDirection, getTextAlign, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (!FEATURE_FLAGS.payments) {
      toast.info('Betalingen worden binnenkort geactiveerd', {
        description: 'Je kunt momenteel alle content gratis bekijken'
      });
      navigate('/billing/coming-soon');
      return;
    }

    // Real implementation would handle Stripe checkout
    toast.success(`${plan.name} plan geselecteerd`);
  };

  return (
    <div className="w-full max-w-full min-w-0 min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8">
        <div className={`text-center mb-12 ${getTextAlign('center')}`}>
          <h1 className={`text-2xl md:text-4xl font-bold mb-4 ${isRTL ? 'arabic-text font-amiri' : ''}`}>
            {t('pricing.title') || 'Kies je plan'}
          </h1>
          <p className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto ${isRTL ? 'arabic-text' : ''}`}>
            {t('pricing.subtitle') || 'Begin je Arabische taalreis met het plan dat het beste bij je past'}
          </p>
          {!FEATURE_FLAGS.payments && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg max-w-md mx-auto">
              <div className={`flex items-center gap-2 text-blue-700 dark:text-blue-300 ${getFlexDirection()}`}>
                <Clock className="w-5 h-5" />
                <span className={`font-medium ${isRTL ? 'arabic-text' : ''}`}>Betalingen binnenkort beschikbaar</span>
              </div>
              <p className={`text-sm mt-1 text-blue-600 dark:text-blue-400 ${isRTL ? 'arabic-text' : ''}`}>
                Alle content is momenteel gratis toegankelijk
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`w-full max-w-full min-w-0 relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <Badge className={`absolute -top-3 ${isRTL ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'}`}>
                  {t('pricing.popular') || 'Meest Populair'}
                </Badge>
              )}
              <CardHeader>
                <CardTitle className={`text-xl md:text-2xl ${isRTL ? 'arabic-text font-amiri' : ''}`}>{plan.name}</CardTitle>
                <CardDescription className={isRTL ? 'arabic-text' : ''}>{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className={`flex items-baseline gap-2 ${getFlexDirection()}`}>
                    <span className={`text-2xl md:text-3xl font-bold ${isRTL ? 'arabic-text' : ''}`}>{plan.price}</span>
                    <span className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                  <div className="text-sm text-muted-foreground">
                    <span className="line-through">{plan.originalPrice}</span>
                    <span className={`ms-2 text-green-600 font-medium ${isRTL ? 'arabic-text' : ''}`}>Bespaar €149</span>
                  </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className={`flex items-center gap-3 ${getFlexDirection()}`}>
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={!FEATURE_FLAGS.payments}
                >
                  <span className={isRTL ? 'arabic-text' : ''}>
                    {!FEATURE_FLAGS.payments ? 'Binnenkort Beschikbaar' : 
                     plan.name === 'Per Klas' ? 'Kies Klas' : 
                     `Start ${plan.name}`}
                  </span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {FEATURE_FLAGS.payments && (
          <div className={`text-center mt-12 ${getTextAlign('center')}`}>
            <p className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
              Alle plannen kunnen op elk moment worden geannuleerd. 
              <br />
              Veilige betalingen via Stripe. 30 dagen geld-terug-garantie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}