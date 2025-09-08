import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, CheckCircle, Star, Sparkles } from 'lucide-react';
import { StudentProgress } from '@/hooks/useStudentProgress';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';

interface ThemeAwareProgressCardProps {
  progress: StudentProgress;
  isCurrentLevel?: boolean;
}

export const ThemeAwareProgressCard: React.FC<ThemeAwareProgressCardProps> = ({ 
  progress, 
  isCurrentLevel = false 
}) => {
  const { themeAge } = useAgeTheme();
  const pointsPercentage = Math.min((progress.total_points / 1000) * 100, 100);
  const pointsRemaining = Math.max(1000 - progress.total_points, 0);

  const getThemeIcon = () => {
    if (progress.is_completed) {
      return themeAge === 'playful' ? 
        <Star className="h-5 w-5 text-success" /> : 
        <CheckCircle className="h-5 w-5 text-success" />;
    }
    
    if (isCurrentLevel) {
      return themeAge === 'playful' ? 
        <Sparkles className="h-5 w-5 text-primary" /> : 
        <Target className="h-5 w-5 text-primary" />;
    }
    
    return <Trophy className="h-5 w-5 text-muted-foreground" />;
  };

  const getCardClasses = () => {
    const baseClasses = "relative transition-all duration-300";
    
    if (themeAge === 'playful') {
      return cn(baseClasses, {
        'ring-2 ring-primary shadow-lg animate-bounce-in': isCurrentLevel,
        'bg-success/10 border-success celebration-effect': progress.is_completed,
      });
    }
    
    if (themeAge === 'professional') {
      return cn(baseClasses, 'subtle-hover', {
        'ring-1 ring-primary/50 shadow-md': isCurrentLevel,
        'bg-success/5 border-success/50': progress.is_completed,
      });
    }
    
    // Clean theme (default)
    return cn(baseClasses, {
      'ring-2 ring-primary shadow-lg': isCurrentLevel,
      'bg-success/5 border-success': progress.is_completed,
    });
  };

  const getBadgeVariant = () => {
    if (themeAge === 'playful') return 'default';
    if (themeAge === 'professional') return 'outline';
    return 'default';
  };

  return (
    <Card className={getCardClasses()}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center gap-2",
            themeAge === 'playful' ? 'text-lg font-bold' : 'text-lg font-semibold'
          )}>
            {getThemeIcon()}
            {progress.niveau?.naam || `Level ${progress.niveau?.niveau_nummer}`}
          </CardTitle>
          <div className="flex gap-2">
            {progress.is_completed && (
              <Badge variant={getBadgeVariant()} className="bg-success text-success-foreground">
                {themeAge === 'playful' ? '🎉 Voltooid!' : 'Voltooid'}
              </Badge>
            )}
            {isCurrentLevel && !progress.is_completed && (
              <Badge variant={getBadgeVariant()}>
                {themeAge === 'playful' ? '⭐ Huidig Level' : 'Huidig Level'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {progress.niveau?.beschrijving && (
          <p className={cn(
            "text-muted-foreground",
            themeAge === 'playful' ? 'text-sm font-medium' : 'text-sm'
          )}>
            {progress.niveau.beschrijving}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {themeAge === 'playful' ? '🎯 Voortgang naar voltooiing' : 'Voortgang naar voltooiing'}
            </span>
            <span className="text-muted-foreground">
              {progress.total_points} / 1000 punten
            </span>
          </div>
          
          <Progress 
            value={pointsPercentage} 
            className={cn(
              "h-3",
              themeAge === 'playful' && "h-4"
            )}
          />
          
          {!progress.is_completed && pointsRemaining > 0 && (
            <p className={cn(
              "text-muted-foreground",
              themeAge === 'playful' ? 'text-xs font-medium' : 'text-xs'
            )}>
              {themeAge === 'playful' ? 
                `🚀 Nog ${pointsRemaining} punten om dit level te voltooien!` :
                `Nog ${pointsRemaining} punten nodig om dit level te voltooien`
              }
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className={cn(
              "text-primary font-semibold",
              themeAge === 'playful' ? 'text-xl font-bold' : 'text-lg'
            )}>
              {progress.completed_tasks}
            </div>
            <div className={cn(
              "text-muted-foreground",
              themeAge === 'playful' ? 'text-xs font-medium' : 'text-xs'
            )}>
              {themeAge === 'playful' ? '📚 Taken voltooid' : 'Taken voltooid'}
            </div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-primary font-semibold",
              themeAge === 'playful' ? 'text-xl font-bold' : 'text-lg'
            )}>
              {progress.completed_questions}
            </div>
            <div className={cn(
              "text-muted-foreground",
              themeAge === 'playful' ? 'text-xs font-medium' : 'text-xs'
            )}>
              {themeAge === 'playful' ? '❓ Vragen beantwoord' : 'Vragen beantwoord'}
            </div>
          </div>
        </div>

        {progress.completed_at && (
          <div className={cn(
            "text-muted-foreground text-center pt-2 border-t",
            themeAge === 'playful' ? 'text-xs font-medium' : 'text-xs'
          )}>
            {themeAge === 'playful' ? '🗓️ ' : ''}
            Voltooid op {new Date(progress.completed_at).toLocaleDateString('nl-NL')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};