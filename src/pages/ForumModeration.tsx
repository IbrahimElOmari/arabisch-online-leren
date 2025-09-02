
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import ForumModerationQueue from '@/components/forum/ForumModerationQueue';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useTranslation } from '@/contexts/TranslationContext';

const ForumModeration = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { getTextAlign, getFlexDirection, getIconSpacing } = useRTLLayout();
  const { getNavigationAttributes, getButtonAttributes } = useAccessibilityRTL();
  const { t } = useTranslation();

  // Only admins and teachers can access this page
  if (!profile || (profile.role !== 'admin' && profile.role !== 'leerkracht')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className={`py-8 ${getTextAlign('center')}`}>
            <h2 className="text-xl font-semibold mb-4">{t('moderation.noAccess') || 'Geen toegang'}</h2>
            <p className="text-muted-foreground">
              {t('moderation.noAccessMessage') || 'Je hebt geen toegang tot deze pagina.'}
            </p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="mt-4"
              {...getButtonAttributes('backToDashboard')}
            >
              {t('moderation.backToDashboard') || 'Terug naar Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" {...getNavigationAttributes()}>
      <div className="container mx-auto p-6">
        <div className={`mb-6 flex items-center gap-4 ${getFlexDirection('row')}`}>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            {...getButtonAttributes('backToDashboard')}
          >
            <ArrowLeft className={`h-4 w-4 ${getIconSpacing('2')}`} />
            {t('moderation.backToDashboard') || 'Terug naar Dashboard'}
          </Button>
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${getTextAlign()}`}>
              <Shield className="h-6 w-6" />
              {t('moderation.title') || 'Forum Moderatie'}
            </h1>
            <p className={`text-muted-foreground ${getTextAlign()}`}>
              {t('moderation.description') || 'Beheer gerapporteerde forum berichten'}
            </p>
          </div>
        </div>

        <ForumModerationQueue />
      </div>
    </div>
  );
};

export default ForumModeration;
