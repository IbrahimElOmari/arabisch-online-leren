/**
 * Certificate Verifier Component
 * Public interface for verifying certificate authenticity
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Loader2, QrCode } from 'lucide-react';
import { verifyCertificate } from '@/services/certificateService';
import type { IssuedCertificate } from '@/types/certificates';

export function CertificateVerifier() {
  const { t } = useTranslation();
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    certificate?: IssuedCertificate;
    reason?: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!certificateId.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const verificationResult = await verifyCertificate(certificateId.trim());
      setResult(verificationResult);
    } catch (error) {
      setResult({
        valid: false,
        reason: error instanceof Error ? error.message : 'Verification failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    // QR scanner implementation would go here
    alert(t('certificates.qr_scanner_coming_soon'));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('certificates.verify_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <Input
            placeholder={t('certificates.enter_id')}
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          <Button onClick={handleScanQR} variant="outline" size="icon">
            <QrCode className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={handleVerify} disabled={loading || !certificateId.trim()} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('certificates.verify')}
        </Button>

        {/* Result Section */}
        {result && (
          <div className="mt-6 space-y-4">
            {result.valid ? (
              <>
                <div className="flex items-center gap-2 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <div>
                    <p className="font-semibold text-success-foreground">
                      {t('certificates.valid_certificate')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('certificates.authentic')}
                    </p>
                  </div>
                </div>

                {result.certificate && (
                  <Card>
                    <CardContent className="pt-6 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('certificates.student_name')}</p>
                          <p className="font-medium">
                            {result.certificate.certificate_data.student_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('certificates.issue_date')}</p>
                          <p className="font-medium">
                            {new Date(result.certificate.issued_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('certificates.certificate_id')}</p>
                          <p className="font-mono text-xs">{result.certificate.certificate_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('certificates.status')}</p>
                          <Badge variant="default">{t('certificates.active')}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <XCircle className="h-6 w-6 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive-foreground">
                    {t('certificates.invalid_certificate')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.reason || t('certificates.not_found')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
