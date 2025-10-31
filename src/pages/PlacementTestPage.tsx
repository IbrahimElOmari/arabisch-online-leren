import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Placeholder for PR4: Placement Test Page
 * This will be fully implemented in PR4 with:
 * - Dynamic question rendering
 * - Multiple question types (MC, drag-drop, fill-blank, audio, voice, sequence)
 * - Progress tracking
 * - Score calculation
 * - Level assignment
 */
const PlacementTestPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-6 w-6" />
            {t('placement.comingSoon', 'Placement Test - Coming Soon')}
          </CardTitle>
          <CardDescription>
            {t('placement.description', 'This feature will be implemented in PR4')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">
                  {t('placement.pr4.title', 'PR4 will implement:')}
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>{t('placement.pr4.feature1', 'Dynamic placement test questions')}</li>
                  <li>{t('placement.pr4.feature2', 'Multiple question types support')}</li>
                  <li>{t('placement.pr4.feature3', 'Automatic score calculation')}</li>
                  <li>{t('placement.pr4.feature4', 'Level assignment based on performance')}</li>
                  <li>{t('placement.pr4.feature5', 'Class assignment with capacity management')}</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementTestPage;
