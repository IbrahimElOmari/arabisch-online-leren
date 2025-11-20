/**
 * Certificate Generator Component
 * UI for generating certificates with preview
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Award, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateCertificate, checkCompletionCriteria } from '@/services/certificateService';
import type { IssuedCertificate } from '@/types/certificates';

interface CertificateGeneratorProps {
  studentId: string;
  niveauId?: string;
  moduleId?: string;
  onGenerated?: (certificate: IssuedCertificate) => void;
}

export function CertificateGenerator({
  studentId,
  niveauId,
  moduleId,
  onGenerated
}: CertificateGeneratorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    progress: number;
    missingCriteria: string[];
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');

  const checkEligibility = async () => {
    setChecking(true);
    try {
      const result = await checkCompletionCriteria(studentId, niveauId, moduleId);
      setEligibility(result);
      
      if (!result.eligible) {
        toast({
          title: t('certificates.not_eligible'),
          description: t('certificates.missing_criteria'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to check eligibility',
        variant: 'destructive'
      });
    } finally {
      setChecking(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const certificate = await generateCertificate({
        studentId,
        niveauId,
        moduleId,
        templateId: selectedTemplate !== 'default' ? selectedTemplate : undefined,
        issuedBy: 'system' // Will be replaced with actual admin ID
      });

      toast({
        title: t('certificates.generated'),
        description: t('certificates.generated_success')
      });

      onGenerated?.(certificate);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to generate certificate',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          {t('certificates.generator_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Eligibility Check */}
        <div className="space-y-3">
          <Button
            onClick={checkEligibility}
            disabled={checking}
            variant="outline"
            className="w-full"
          >
            {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('certificates.check_eligibility')}
          </Button>

          {eligibility && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('certificates.completion_progress')}
                </span>
                <Badge variant={eligibility.eligible ? 'default' : 'secondary'}>
                  {eligibility.progress.toFixed(0)}%
                </Badge>
              </div>

              {eligibility.eligible ? (
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-md">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm text-success-foreground">
                    {t('certificates.eligible')}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm text-destructive-foreground">
                      {t('certificates.not_eligible')}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium">{t('certificates.missing')}:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {eligibility.missingCriteria.map((criteria, idx) => (
                        <li key={idx}>{criteria}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('certificates.template')}</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t('certificates.template_default')}</SelectItem>
              <SelectItem value="elegant">{t('certificates.template_elegant')}</SelectItem>
              <SelectItem value="modern">{t('certificates.template_modern')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={loading || !eligibility?.eligible}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Download className="mr-2 h-4 w-4" />
          {t('certificates.generate')}
        </Button>
      </CardContent>
    </Card>
  );
}
