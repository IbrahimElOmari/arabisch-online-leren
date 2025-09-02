
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

const Leerstof = () => {
  const { user, authReady, loading: authLoading } = useAuth();
  const { getTextAlign, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  // Auth loading gate
  if (authLoading && !authReady) {
    return <FullPageLoader text="Laden..." />;
  }

  // Redirect if no user
  if (authReady && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto p-6">
        <h1 className={`text-2xl font-bold mb-6 ${getTextAlign('left')} ${isRTL ? 'arabic-text font-amiri' : ''}`}>{t('leerstof.title')}</h1>
        <div className="main-content-card">
          <p className={`text-muted-foreground ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
            {t('leerstof.comingSoon')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leerstof;
