
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

const NotFound = () => {
  const location = useLocation();
  const { getTextAlign, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={getTextAlign('center')}>
        <h1 className={`text-4xl font-bold mb-4 ${isRTL ? 'arabic-text' : ''}`}>404</h1>
        <p className={`text-xl text-muted-foreground mb-4 ${isRTL ? 'arabic-text' : ''}`}>{t('errors.pageNotFound')}</p>
        <Link to="/" className={`text-primary hover:text-primary/80 underline ${isRTL ? 'arabic-text' : ''}`}>
          {t('navigation.returnHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
