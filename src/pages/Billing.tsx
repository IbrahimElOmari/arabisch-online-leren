import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, ExternalLink, Clock } from 'lucide-react';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useMySubscriptionsQuery } from '@/services/subscriptionService';
import { useMyPaymentsQuery } from '@/services/paymentService';
import { createPortalSession } from '@/services/stripeService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function Billing() {
  const navigate = useNavigate();
  const { data: subscriptions, isLoading: subscriptionsLoading } = useMySubscriptionsQuery();
  const { data: payments, isLoading: paymentsLoading } = useMyPaymentsQuery();

  const handleManageBilling = async () => {
    if (!FEATURE_FLAGS.payments) {
      toast.info('Betalingen worden binnenkort geactiveerd');
      navigate('/billing/coming-soon');
      return;
    }

    try {
      const { url } = await createPortalSession();
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Kon billing portal niet openen');
    }
  };

  if (!FEATURE_FLAGS.payments) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Facturatie & Abonnement</h1>
          <p className="text-muted-foreground">Beheer je betalingen en abonnement</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Betalingen Binnenkort Beschikbaar</CardTitle>
            <CardDescription>
              Alle leerinhoud is momenteel gratis toegankelijk terwijl we het betalingssysteem ontwikkelen
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => navigate('/dashboard')}>
              Terug naar Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              Bekijk Toekomstige Plannen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Facturatie & Abonnement</h1>
          <p className="text-muted-foreground">Beheer je betalingen en abonnement</p>
        </div>
        <Button onClick={handleManageBilling} className="gap-2">
          <ExternalLink className="w-4 h-4" />
          Beheer Facturatie
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Huidig Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionsLoading ? (
              <Skeleton className="h-20" />
            ) : subscriptions && subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Abonnement</span>
                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                          {subscription.status}
                        </Badge>
                      </div>
                      {subscription.current_period_end && (
                        <p className="text-sm text-muted-foreground">
                          Vernieuwt op {new Date(subscription.current_period_end).toLocaleDateString('nl-NL')}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleManageBilling}>
                      Beheer
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Geen actief abonnement</p>
                <Button onClick={() => navigate('/pricing')}>
                  Kies een Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Betalingsgeschiedenis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Skeleton className="h-32" />
            ) : payments && payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <div key={payment.id}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {payment.amount ? `€${(payment.amount / 100).toFixed(2)}` : 'Betaling'}
                          </span>
                          <Badge variant={
                            payment.status === 'paid' ? 'default' :
                            payment.status === 'pending' ? 'secondary' :
                            'destructive'
                          }>
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                    {index < payments.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Geen betalingsgeschiedenis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}