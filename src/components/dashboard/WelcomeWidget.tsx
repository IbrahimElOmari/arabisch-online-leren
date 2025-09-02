
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

interface WelcomeWidgetProps {
  recentActivity?: string;
}

export const WelcomeWidget = ({ recentActivity }: WelcomeWidgetProps) => {
  const { profile } = useAuth();
  const { isRTL, getTextAlign } = useRTLLayout();
  const { t } = useTranslation();

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20">
      <CardContent className="p-6">
        <div className={`${getTextAlign('center')}`}>
          <h2 className={`text-3xl font-bold text-primary mb-2 ${isRTL ? 'arabic-text font-amiri' : ''}`}>
            {isRTL ? 'أهلاً وسهلاً بك' : 'Welkom bij Leer Arabisch'}
          </h2>
          <p className={`text-lg text-muted-foreground mb-3 ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? `مرحباً بعودتك، ${profile?.full_name}` : `${t('welcome.greeting')}, ${profile?.full_name}`}
          </p>
          {recentActivity && (
            <p className={`text-sm text-muted-foreground bg-background/50 rounded-lg px-4 py-2 inline-block ${getTextAlign('center')}`}>
              {recentActivity}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
