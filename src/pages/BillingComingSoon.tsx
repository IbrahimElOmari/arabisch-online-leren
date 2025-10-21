import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BillingComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Betalingen Binnenkort Beschikbaar</CardTitle>
          <CardDescription>
            We werken hard aan het toevoegen van betalingsfunctionaliteit aan het platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Wat komt er aan:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Eenmalige klasbetalingen</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Maandelijkse abonnementen</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Jaarlijkse abonnementen</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Veilige Stripe betalingen</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Abonnementsbeheer portal</span>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Huidige status:</strong> Je kunt al alle leerinhoud bekijken en gebruiken. 
              Betalingen zijn tijdelijk uitgeschakeld terwijl we het systeem verder ontwikkelen.
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate('/dashboard')} className="flex-1">
              Terug naar Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Naar Startpagina
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}