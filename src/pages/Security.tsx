
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { GDPRCompliance } from '@/components/security/GDPRCompliance';
import { ContentModerationPanel } from '@/components/security/ContentModerationPanel';
import { Shield, FileText, MessageSquare, Users } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

const Security = () => {
  const { user, profile, loading } = useAuth();
  const { getFlexDirection, getTextAlign, getIconSpacing, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  // Only admins and teachers can access security features
  if (!['admin', 'leerkracht'].includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className={`text-2xl font-bold text-foreground ${getFlexDirection()} items-center gap-2 ${isRTL ? 'arabic-text font-amiri' : ''}`}>
            <Shield className="h-6 w-6" />
            {t('security.title')}
          </h1>
          <p className={`text-muted-foreground ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
            {t('security.description')}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="security" className={`${getFlexDirection()} items-center gap-2`}>
              <Shield className="h-4 w-4" />
              <span className={isRTL ? 'arabic-text' : ''}>{t('security.dashboard')}</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className={`${getFlexDirection()} items-center gap-2`}>
              <MessageSquare className="h-4 w-4" />
              <span className={isRTL ? 'arabic-text' : ''}>{t('security.moderation')}</span>
            </TabsTrigger>
            <TabsTrigger value="gdpr" className={`${getFlexDirection()} items-center gap-2`}>
              <FileText className="h-4 w-4" />
              <span className={isRTL ? 'arabic-text' : ''}>{t('security.gdpr')}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className={`${getFlexDirection()} items-center gap-2`}>
              <Users className="h-4 w-4" />
              <span className={isRTL ? 'arabic-text' : ''}>{t('security.userManagement')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="mt-6">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="moderation" className="mt-6">
            <ContentModerationPanel />
          </TabsContent>

          <TabsContent value="gdpr" className="mt-6">
            <GDPRCompliance />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className={`${getTextAlign('center')} py-8 text-muted-foreground`}>
              <span className={isRTL ? 'arabic-text' : ''}>{t('security.userManagementComingSoon')}</span>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Security;
