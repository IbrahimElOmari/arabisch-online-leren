import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

const PrivacyPolicy = () => {
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
            <CardTitle className={`text-2xl ${getTextAlign('left')} ${isRTL ? 'arabic-text font-amiri' : ''}`}>{t('privacy.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className={`text-lg font-semibold mb-3 ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>{t('privacy.introduction.title')}</h3>
              <p className={`text-sm text-muted-foreground ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
                {t('privacy.introduction.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Welke gegevens verzamelen wij?</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Naam en e-mailadres bij registratie</p>
                <p>• Ouder/voogd e-mailadres (voor leerlingen onder 16)</p>
                <p>• Voortgangsgegevens en beoordelingen</p>
                <p>• Technische gegevens zoals IP-adres en browsercookies</p>
                <p>• Communicatie via het forum en berichten</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Hoe gebruiken wij uw gegevens?</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Het leveren van onze onderwijsdiensten</p>
                <p>• Voortgang bijhouden en feedback geven</p>
                <p>• Communicatie over lessen en updates</p>
                <p>• Technische ondersteuning en probleemoplossing</p>
                <p>• Verbetering van onze dienstverlening</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Gegevensbeveiliging</h3>
              <p className="text-sm text-muted-foreground">
                Wij implementeren passende technische en organisatorische maatregelen om uw persoonlijke gegevens te beschermen 
                tegen ongeautoriseerde toegang, wijziging, openbaarmaking of vernietiging.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Delen van gegevens</h3>
              <p className="text-sm text-muted-foreground">
                Wij delen uw persoonlijke gegevens niet met derden, behalve wanneer dit noodzakelijk is voor het leveren van 
                onze diensten of wanneer wij hiertoe wettelijk verplicht zijn.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Uw rechten</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Recht op inzage in uw gegevens</p>
                <p>• Recht op rectificatie van onjuiste gegevens</p>
                <p>• Recht op verwijdering van uw gegevens</p>
                <p>• Recht op beperking van verwerking</p>
                <p>• Recht op gegevensoverdraagbaarheid</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Cookies</h3>
              <p className="text-sm text-muted-foreground">
                Wij gebruiken cookies om uw ervaring te verbeteren en onze diensten te optimaliseren. 
                U kunt cookies uitschakelen in uw browserinstellingen.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Bewaarperiode</h3>
              <p className="text-sm text-muted-foreground">
                Wij bewaren uw gegevens niet langer dan noodzakelijk voor de doeleinden waarvoor zij zijn verzameld, 
                tenzij een langere bewaarperiode wettelijk vereist is.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">9. Wijzigingen in dit beleid</h3>
              <p className="text-sm text-muted-foreground">
                Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. Belangrijke wijzigingen zullen wij u meedelen 
                via e-mail of een opvallende melding op onze website.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">10. Contact</h3>
              <p className="text-sm text-muted-foreground">
                Voor vragen over dit privacybeleid kunt u contact opnemen via:
                <br />
                E-mail: privacy@arabischonline.nl
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

export default PrivacyPolicy;