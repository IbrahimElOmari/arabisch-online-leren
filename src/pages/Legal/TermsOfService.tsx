
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
            <CardTitle>Algemene Voorwaarden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Dienstverlening</h2>
              <p className="text-muted-foreground leading-relaxed">
                Arabisch Online Leren biedt online Arabische taallessen via ons platform. 
                Door gebruik te maken van onze diensten gaat u akkoord met deze voorwaarden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Account en Toegang</h2>
              <p className="text-muted-foreground leading-relaxed">
                U bent verantwoordelijk voor het veilig houden van uw accountgegevens. 
                Delen van accounttoegang met derden is niet toegestaan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Gedragsregels</h2>
              <p className="text-muted-foreground leading-relaxed">
                Gebruikers dienen zich respectvol te gedragen in forums en tijdens lessen. 
                Ongepast gedrag kan leiden tot opschorting van het account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Intellectueel Eigendom</h2>
              <p className="text-muted-foreground leading-relaxed">
                Alle lesmaterialen en content zijn eigendom van Arabisch Online Leren 
                en mogen niet zonder toestemming worden gedeeld of gekopieerd.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Betalingen en Annulering</h2>
              <p className="text-muted-foreground leading-relaxed">
                Betalingsvoorwaarden en annuleringsbeleid worden bij inschrijving gecommuniceerd. 
                Terugbetalingen zijn onderworpen aan ons terugbetalingsbeleid.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Aansprakelijkheid</h2>
              <p className="text-muted-foreground leading-relaxed">
                Wij streven ernaar om ononderbroken service te leveren, maar kunnen niet 
                aansprakelijk worden gesteld voor technische storingen of serviceondes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Wijzigingen</h2>
              <p className="text-muted-foreground leading-relaxed">
                Deze voorwaarden kunnen worden gewijzigd. Gebruikers worden van 
                belangrijke wijzigingen op de hoogte gesteld.
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