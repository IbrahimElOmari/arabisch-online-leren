import { Zap, TrendingUp, Award, Star, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface PointsWidgetProps {
  totalPoints: number;
  levelPoints?: number;
  maxLevelPoints?: number;
  bonusPoints?: number;
  rank?: number;
  totalUsers?: number;
  recentGain?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export function PointsWidget({
  totalPoints = 0,
  levelPoints = 0,
  maxLevelPoints = 1000,
  bonusPoints = 0,
  rank,
  totalUsers,
  recentGain,
  className,
  variant = 'default'
}: PointsWidgetProps) {
  const { isRTL } = useRTLLayout();

  const progressPercentage = maxLevelPoints > 0 ? (levelPoints / maxLevelPoints) * 100 : 0;
  const remainingPoints = Math.max(0, maxLevelPoints - levelPoints);

  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };

  const getRankColor = () => {
    if (!rank) return 'bg-gray-500';
    if (rank <= 3) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    return 'bg-gradient-to-r from-gray-400 to-gray-600';
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3", className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className={cn("font-semibold text-lg", isRTL && "arabic-text")}>
            {formatPoints(totalPoints)}
          </span>
        </div>
        
        {rank && (
          <Badge variant="secondary" className="text-xs">
            #{rank} van {totalUsers}
          </Badge>
        )}
        
        {recentGain && recentGain > 0 && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <TrendingUp className="h-3 w-3" />
            +{recentGain}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2", isRTL && "arabic-text")}>
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-foreground rounded-full flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          Punten Overzicht
          
          {recentGain && recentGain > 0 && (
            <Badge variant="secondary" className="ms-auto animate-pulse">
              <TrendingUp className="h-3 w-3 me-1" />
              +{recentGain}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Total Points Display */}
        <div className="text-center">
          <div className={cn(
            "text-3xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent",
            isRTL && "arabic-text"
          )}>
            {formatPoints(totalPoints)}
          </div>
          <p className={cn("text-sm text-muted-foreground", isRTL && "arabic-text")}>
            Totaal behaalde punten
          </p>
        </div>

        {variant === 'detailed' && (
          <>
            {/* Level Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={cn("text-muted-foreground", isRTL && "arabic-text")}>
                  Niveau voortgang
                </span>
                <span className={cn("font-medium", isRTL && "arabic-text")}>
                  {levelPoints}/{maxLevelPoints}
                </span>
              </div>
              
              <Progress 
                value={progressPercentage} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className={cn(isRTL && "arabic-text")}>
                  {Math.round(progressPercentage)}% voltooid
                </span>
                <span className={cn(isRTL && "arabic-text")}>
                  Nog {remainingPoints} nodig
                </span>
              </div>
            </div>

            {/* Points Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                <div className={cn("text-lg font-semibold", isRTL && "arabic-text")}>
                  {levelPoints}
                </div>
                <div className={cn("text-xs text-muted-foreground", isRTL && "arabic-text")}>
                  Niveau punten
                </div>
              </div>
              
              {bonusPoints > 0 && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className={cn("text-lg font-semibold", isRTL && "arabic-text")}>
                    {bonusPoints}
                  </div>
                  <div className={cn("text-xs text-muted-foreground", isRTL && "arabic-text")}>
                    Bonus punten
                  </div>
                </div>
              )}
            </div>

            {/* Ranking */}
            {rank && totalUsers && (
              <div className="text-center">
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm font-medium",
                  getRankColor()
                )}>
                  <Award className="h-4 w-4" />
                  <span className={cn(isRTL && "arabic-text")}>
                    #{rank} van {totalUsers}
                  </span>
                </div>
                
                <p className={cn("text-xs text-muted-foreground mt-2", isRTL && "arabic-text")}>
                  Je staat op plaats {rank} in de ranglijst
                </p>
              </div>
            )}
          </>
        )}

        {/* Motivational Messages */}
        {variant === 'detailed' && (
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            {progressPercentage >= 100 ? (
              <p className={cn("text-sm text-primary font-medium", isRTL && "arabic-text")}>
                🎉 Gefeliciteerd! Je hebt dit niveau voltooid!
              </p>
            ) : progressPercentage >= 75 ? (
              <p className={cn("text-sm text-primary", isRTL && "arabic-text")}>
                🔥 Geweldig! Je bent bijna klaar met dit niveau!
              </p>
            ) : progressPercentage >= 50 ? (
              <p className={cn("text-sm text-primary", isRTL && "arabic-text")}>
                💪 Goed bezig! Je bent al halverwege!
              </p>
            ) : progressPercentage >= 25 ? (
              <p className={cn("text-sm text-primary", isRTL && "arabic-text")}>
                🚀 Prima start! Blijf doorgaan!
              </p>
            ) : (
              <p className={cn("text-sm text-primary", isRTL && "arabic-text")}>
                ⭐ Begin je leeravontuur! Elke stap telt!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}