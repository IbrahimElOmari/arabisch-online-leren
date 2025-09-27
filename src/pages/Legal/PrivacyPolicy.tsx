import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl p-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 me-2" />
          Terug
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Privacybeleid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Inleiding</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dit privacybeleid beschrijft hoe Arabisch Online Leren uw persoonlijke gegevens verzamelt, 
                gebruikt en beschermt wanneer u onze online leerplatform gebruikt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Welke gegevens verzamelen wij</h2>
              <p className="text-muted-foreground leading-relaxed">
                Wij verzamelen informatie die u ons verstrekt bij registratie, zoals naam, e-mailadres, 
                en leervoortgang. Voor minderjarigen verzamelen we ook ouderlijke contactgegevens.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Hoe we uw gegevens gebruiken</h2>
              <p className="text-muted-foreground leading-relaxed">
                Uw gegevens worden gebruikt voor het leveren van onze onderwijsdiensten, 
                het bijhouden van leervoortgang, en communicatie over uw account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Beveiliging</h2>
              <p className="text-muted-foreground leading-relaxed">
                Wij implementeren passende technische en organisatorische maatregelen 
                om uw persoonlijke gegevens te beschermen tegen ongeautoriseerde toegang.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Uw rechten</h2>
              <p className="text-muted-foreground leading-relaxed">
                U heeft het recht om uw gegevens in te zien, te corrigeren, of te verwijderen. 
                Ga naar uw accountinstellingen of neem contact met ons op.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Voor vragen over dit privacybeleid kunt u contact opnemen via [contactgegevens].
              </p>
            </section>

            <p className="text-sm text-muted-foreground mt-8">
              Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}