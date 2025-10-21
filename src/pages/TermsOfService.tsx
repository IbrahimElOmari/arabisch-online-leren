import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

const TermsOfService = () => {
  const navigate = useNavigate();
  const { getFlexDirection, getTextAlign, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className={`${getFlexDirection()} items-center gap-2`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className={isRTL ? 'arabic-text' : ''}>{t('navigation.back')}</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className={`text-2xl ${getTextAlign('left')} ${isRTL ? 'arabic-text font-amiri' : ''}`}>{t('terms.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Definities</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• "Wij", "ons", "onze": Arabisch Online</p>
                <p>• "U", "uw": De gebruiker van onze diensten</p>
                <p>• "Diensten": Alle online Arabische lessen en gerelateerde services</p>
                <p>• "Platform": Onze website en applicatie</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Acceptatie van voorwaarden</h3>
              <p className="text-sm text-muted-foreground">
                Door gebruik te maken van onze diensten, accepteert u deze algemene voorwaarden. 
                Indien u niet akkoord gaat met deze voorwaarden, dient u onze diensten niet te gebruiken.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Registratie en account</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• U bent verantwoordelijk voor het verstrekken van accurate informatie</p>
                <p>• U bent verantwoordelijk voor het beveiligen van uw account</p>
                <p>• Elke persoon mag slechts één account hebben</p>
                <p>• Leerlingen onder 16 hebben toestemming van ouders/voogden nodig</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Gebruik van diensten</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Onze diensten zijn bedoeld voor educatieve doeleinden</p>
                <p>• U mag geen inhoud delen die illegaal, beledigend of ongepast is</p>
                <p>• U mag niet proberen onze systemen te verstoren of te hacken</p>
                <p>• Commercieel gebruik zonder toestemming is niet toegestaan</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Betaling en annulering</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Betalingen dienen vooraf te worden voldaan</p>
                <p>• Annuleringen zijn mogelijk tot 14 dagen na aankoop</p>
                <p>• Terugbetalingen worden binnen 14 dagen verwerkt</p>
                <p>• Bij herhaalde gemiste lessen behouden wij ons het recht voor om toegang te beperken</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Intellectueel eigendom</h3>
              <p className="text-sm text-muted-foreground">
                Alle inhoud op ons platform, inclusief teksten, video's, audio en afbeeldingen, is beschermd door auteursrecht. 
                U mag deze inhoud niet reproduceren, distribueren of commercieel gebruiken zonder onze schriftelijke toestemming.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Gedragscode</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Behandel andere gebruikers met respect</p>
                <p>• Geen discriminatie, pesterijen of beledigingen</p>
                <p>• Respecteer de privacy van anderen</p>
                <p>• Volg de instructies van leerkrachten en moderatoren</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Beperking van aansprakelijkheid</h3>
              <p className="text-sm text-muted-foreground">
                Wij streven ernaar kwalitatieve diensten te leveren, maar kunnen niet garanderen dat onze diensten 
                altijd foutloos of ononderbroken beschikbaar zijn. Onze aansprakelijkheid is beperkt tot het bedrag 
                dat u heeft betaald voor onze diensten.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">9. Beëindiging</h3>
              <p className="text-sm text-muted-foreground">
                Wij behouden ons het recht voor om uw toegang tot onze diensten te beëindigen bij schending van 
                deze voorwaarden. U kunt uw account te allen tijde beëindigen door contact met ons op te nemen.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">10. Wijzigingen</h3>
              <p className="text-sm text-muted-foreground">
                Wij kunnen deze voorwaarden van tijd tot tijd wijzigen. Belangrijke wijzigingen zullen wij u 
                meedelen via e-mail of een opvallende melding op ons platform.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">11. Toepasselijk recht</h3>
              <p className="text-sm text-muted-foreground">
                Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de 
                bevoegde rechter in Nederland.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">12. Contact</h3>
              <p className="text-sm text-muted-foreground">
                Voor vragen over deze voorwaarden kunt u contact opnemen via:
                <br />
                E-mail: info@arabischonline.nl
              </p>
            </section>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;