import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';

type PaymentResult = 'processing' | 'success' | 'failed' | 'error';

const PaymentReturnTestPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<PaymentResult>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const paymentId = searchParams.get('payment_id');
  const enrollmentId = searchParams.get('enrollment_id');

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    if (!paymentId || !enrollmentId) {
      setResult('error');
      setErrorMessage(t('payment.error.missingParams', 'Missing payment parameters'));
      logger.error('Payment return missing params', { paymentId, enrollmentId });
      return;
    }

    try {
      // Simulate payment success by calling webhook
      const { error } = await supabase.functions.invoke('payment-webhook-test', {
        body: {
          event: 'payment.success',
          payment_id: paymentId
        }
      });

      if (error) {
        throw error;
      }

      logger.info('Stub payment succeeded', { paymentId, enrollmentId });
      setResult('success');

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/placement-test');
      }, 3000);

    } catch (error) {
      const err = error as Error;
      logger.error('Payment processing failed', { paymentId }, err);
      setResult('failed');
      setErrorMessage(err.message || t('payment.error.processing', 'Payment processing failed'));
    }
  };

  const handleRetry = () => {
    navigate(`/enroll/${enrollmentId}`);
  };

  const handleContinue = () => {
    navigate('/placement-test');
  };

  return (
    <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result === 'processing' && (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                {t('payment.processing.title', 'Processing Payment')}
              </>
            )}
            {result === 'success' && (
              <>
                <CheckCircle2 className="h-6 w-6 text-success" />
                {t('payment.success.title', 'Payment Successful')}
              </>
            )}
            {result === 'failed' && (
              <>
                <XCircle className="h-6 w-6 text-destructive" />
                {t('payment.failed.title', 'Payment Failed')}
              </>
            )}
            {result === 'error' && (
              <>
                <AlertTriangle className="h-6 w-6 text-warning" />
                {t('payment.error.title', 'Payment Error')}
              </>
            )}
          </CardTitle>
          <CardDescription>
            {result === 'processing' && t('payment.processing.description', 'Please wait while we process your payment...')}
            {result === 'success' && t('payment.success.description', 'Your payment has been processed successfully.')}
            {result === 'failed' && t('payment.failed.description', 'We could not process your payment.')}
            {result === 'error' && t('payment.error.description', 'An error occurred during payment processing.')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Test Mode Badge */}
          <Alert>
            <AlertDescription>
              <div className="font-semibold mb-1">TEST MODE</div>
              {t('payment.testMode', 'This is a simulated payment. No real charges have been made.')}
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {(result === 'failed' || result === 'error') && errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success Info */}
          {result === 'success' && (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {t('payment.success.nextStep', 'You will be redirected to the placement test in a few seconds...')}
              </p>
              <div className="flex gap-2 text-xs">
                <span className="font-medium">Payment ID:</span>
                <span className="text-muted-foreground font-mono">{paymentId}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {result === 'success' && (
              <Button className="flex-1" onClick={handleContinue}>
                {t('payment.success.continue', 'Continue to Placement Test')}
              </Button>
            )}
            {(result === 'failed' || result === 'error') && (
              <>
                <Button variant="outline" className="flex-1" onClick={() => navigate('/modules')}>
                  {t('payment.failed.back', 'Back to Modules')}
                </Button>
                <Button className="flex-1" onClick={handleRetry}>
                  {t('payment.failed.retry', 'Try Again')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReturnTestPage;
