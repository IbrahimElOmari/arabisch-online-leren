
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { useArabicNumerals } from '@/hooks/useArabicNumerals';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useRTL } from '@/contexts/RTLContext';

interface WelcomeWidgetProps {
  recentActivity?: string;
}

export const WelcomeWidget = ({ recentActivity }: WelcomeWidgetProps) => {
  const { profile } = useAuth();
  const { isRTL, getTextAlign } = useRTLLayout();
  const { t } = useTranslation();
  const { formatDateTime } = useArabicNumerals();
  const { isLoading } = useRTL();

  const currentDate = new Date();
  const formattedDate = formatDateTime(currentDate);

  return (
    <>
      <LoadingOverlay show={isLoading} />
      <Card className={`mb-6 bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20 transition-all duration-300 ${isRTL ? 'rtl-slide-in' : 'ltr-slide-in'}`}>
        <CardContent className="p-6">
          <div className={`${getTextAlign('center')}`}>
            <h2 className={`text-3xl font-bold text-primary mb-2 transition-all duration-300 ${isRTL ? 'arabic-text font-amiri' : ''}`}>
              {isRTL ? 'أهلاً وسهلاً بك' : 'Welkom bij Leer Arabisch'}
            </h2>
            <p className={`text-lg text-muted-foreground mb-3 transition-all duration-300 ${isRTL ? 'arabic-text' : ''}`}>
              {isRTL ? `مرحباً بعودتك، ${profile?.full_name}` : `${t('welcome.greeting')}, ${profile?.full_name}`}
            </p>
            <p className={`text-sm text-muted-foreground mb-2 ${isRTL ? 'arabic-text arabic-numerals' : ''}`}>
              {formattedDate}
            </p>
            {recentActivity && (
              <p className={`text-sm text-muted-foreground bg-background/50 rounded-lg px-4 py-2 inline-block transition-all duration-300 ${getTextAlign('center')} ${isRTL ? 'arabic-text' : ''}`}>
                {recentActivity}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
