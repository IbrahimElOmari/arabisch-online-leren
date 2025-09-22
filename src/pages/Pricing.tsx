import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock } from 'lucide-react';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Kies je plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Begin je Arabische taalreis met het plan dat het beste bij je past
        </p>
        {!FEATURE_FLAGS.payments && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg max-w-md mx-auto">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Betalingen binnenkort beschikbaar</span>
            </div>
            <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">
              Alle content is momenteel gratis toegankelijk
            </p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                Meest Populair
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="text-sm text-muted-foreground">
                    <span className="line-through">{plan.originalPrice}</span>
                    <span className="ml-2 text-green-600 font-medium">Bespaar €149</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(plan)}
                disabled={!FEATURE_FLAGS.payments}
              >
                {!FEATURE_FLAGS.payments ? 'Binnenkort Beschikbaar' : 
                 plan.name === 'Per Klas' ? 'Kies Klas' : 
                 `Start ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {FEATURE_FLAGS.payments && (
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Alle plannen kunnen op elk moment worden geannuleerd. 
            <br />
            Veilige betalingen via Stripe. 30 dagen geld-terug-garantie.
          </p>
        </div>
      )}
    </div>
  );
}