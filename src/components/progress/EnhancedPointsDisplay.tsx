import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Target, Gift, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { type EnhancedStudentProgress } from '@/hooks/useEnhancedProgress';

interface EnhancedPointsDisplayProps {
  progress: EnhancedStudentProgress[];
  currentNiveauId?: string;
  compact?: boolean;
}

export const EnhancedPointsDisplay = ({ 
  progress, 
  currentNiveauId, 
  compact = false 
}: EnhancedPointsDisplayProps) => {
  const { themeAge } = useAgeTheme();

  // Calculate totals
  const totalPoints = progress.reduce((sum, p) => sum + (p.total_points_with_bonus || 0), 0);
  const totalBadges = progress.reduce((sum, p) => sum + (p.earned_badges?.length || 0), 0);
  const completedLevels = progress.filter(p => p.is_completed).length;

  // Get current level progress
  const currentLevelProgress = currentNiveauId 
    ? progress.find(p => p.niveau_id === currentNiveauId)
    : progress.find(p => !p.is_completed && p.total_points_with_bonus! > 0) || progress[0];

  const getThemeClasses = () => {
    switch (themeAge) {
      case 'playful':
        return 'bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20';
      case 'professional':
        return 'bg-gradient-to-r from-muted/50 to-background border-muted';
      default:
        return 'bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20';
    }
  };

  if (compact) {
    return (
      <Card className={cn("relative overflow-hidden", getThemeClasses())}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{totalPoints} Punten</div>
                <div className="text-sm text-muted-foreground">
                  {totalBadges} badges • {completedLevels} niveaus voltooid
                </div>
              </div>
            </div>
            {currentLevelProgress && (
              <div className="text-right">
                <div className="text-sm font-medium">
                  {currentLevelProgress.niveau?.naam}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentLevelProgress.total_points_with_bonus}/1000
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Points Card */}
      <Card className={cn("relative overflow-hidden", getThemeClasses())}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            Totale Punten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary mb-2">{totalPoints}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Over alle niveaus</span>
          </div>
        </CardContent>
        {themeAge === 'playful' && (
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400/20 animate-pulse" />
        )}
      </Card>

      {/* Current Level Progress */}
      {currentLevelProgress && (
        <Card className={cn("relative overflow-hidden", getThemeClasses())}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-500" />
              Huidig Niveau
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{currentLevelProgress.niveau?.naam}</span>
                <Badge variant={currentLevelProgress.is_completed ? "default" : "secondary"}>
                  {currentLevelProgress.is_completed ? 'Voltooid' : 'Actief'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Voortgang</span>
                  <span>{currentLevelProgress.total_points_with_bonus}/1000</span>
                </div>
                <Progress 
                  value={Math.min((currentLevelProgress.total_points_with_bonus! / 1000) * 100, 100)} 
                  className="h-3"
                />
              </div>

              {/* Show bonus points if any */}
              {currentLevelProgress.bonus_points! > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">
                    +{currentLevelProgress.bonus_points} bonuspunten
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Badges */}
      <Card className={cn("relative overflow-hidden", getThemeClasses())}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-purple-500" />
            Badges Verdiend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary mb-2">{totalBadges}</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Niveaus voltooid</span>
              <span className="font-medium">{completedLevels}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">In voortgang</span>
              <span className="font-medium">{progress.filter(p => !p.is_completed).length}</span>
            </div>
          </div>
        </CardContent>
        {themeAge === 'playful' && (
          <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-purple-400/20 animate-ping" />
        )}
      </Card>
    </div>
  );
};