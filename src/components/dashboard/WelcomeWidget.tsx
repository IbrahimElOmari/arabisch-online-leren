
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useRTL } from '@/contexts/RTLContext';

interface WelcomeWidgetProps {
  recentActivity?: string;
}

export const WelcomeWidget = ({ recentActivity }: WelcomeWidgetProps) => {
  const { profile } = useAuth();
  const { isRTL } = useRTL();

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20">
      <CardContent className="p-6">
        <div className="text-center">
          <h2 className={`text-3xl font-bold text-primary mb-2 ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'أهلاً وسهلاً بك' : 'أهلاً وسهلاً بك'}
          </h2>
          <p className="text-lg text-muted-foreground mb-3">
            {isRTL ? `مرحباً بعودتك، ${profile?.full_name}` : `Welkom terug, ${profile?.full_name}`}
          </p>
          {recentActivity && (
            <p className="text-sm text-muted-foreground bg-background/50 rounded-lg px-4 py-2 inline-block">
              {recentActivity}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
