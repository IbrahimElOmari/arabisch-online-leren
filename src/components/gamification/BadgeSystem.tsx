
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Zap, Crown, Award } from 'lucide-react';

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface UserLevel {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
}

interface BadgeSystemProps {
  badges: UserBadge[];
  userLevel: UserLevel;
  showProgress?: boolean;
}

const BadgeIcons = {
  trophy: Trophy,
  star: Star,
  target: Target,
  zap: Zap,
  crown: Crown,
  award: Award
};

export const BadgeSystem = ({ badges, userLevel, showProgress = true }: BadgeSystemProps) => {
  const earnedBadges = badges.filter(badge => badge.earned);
  const availableBadges = badges.filter(badge => !badge.earned);
  
  const levelProgress = (userLevel.currentXP / userLevel.nextLevelXP) * 100;

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      {showProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Niveau {userLevel.currentLevel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{userLevel.currentXP} XP</span>
                <span>{userLevel.nextLevelXP} XP</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {userLevel.nextLevelXP - userLevel.currentXP} XP tot niveau {userLevel.currentLevel + 1}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Behaalde Badges ({earnedBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earnedBadges.map((badge) => {
                const IconComponent = BadgeIcons[badge.icon as keyof typeof BadgeIcons] || Award;
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 hover:shadow-md transition-shadow"
                  >
                    <IconComponent className="h-8 w-8 text-yellow-600 mb-2" />
                    <h3 className="font-medium text-sm text-center">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      {badge.description}
                    </p>
                    {badge.earnedAt && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {new Date(badge.earnedAt).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Badges */}
      {availableBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              Beschikbare Badges ({availableBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableBadges.map((badge) => {
                const IconComponent = BadgeIcons[badge.icon as keyof typeof BadgeIcons] || Award;
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors opacity-75"
                  >
                    <IconComponent className="h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-sm text-center">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      {badge.description}
                    </p>
                    {badge.progress !== undefined && badge.maxProgress && (
                      <div className="w-full mt-2">
                        <Progress 
                          value={(badge.progress / badge.maxProgress) * 100} 
                          className="h-1"
                        />
                        <p className="text-xs text-center mt-1">
                          {badge.progress}/{badge.maxProgress}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
