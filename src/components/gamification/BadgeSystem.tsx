import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Zap, Crown, Award } from 'lucide-react';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'achievement' | 'streak' | 'mastery' | 'social';
  requirement: number;
  currentProgress: number;
  earned: boolean;
  earnedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface BadgeSystemProps {
  studentProgress?: any[];
}

export const BadgeSystem: React.FC<BadgeSystemProps> = ({ studentProgress = [] }) => {
  const { themeAge } = useAgeTheme();

  // Calculate earned badges based on progress
  const calculateBadgeProgress = (): BadgeDefinition[] => {
    const totalPoints = studentProgress.reduce((sum, p) => sum + p.total_points, 0);
    const completedLevels = studentProgress.filter(p => p.is_completed).length;
    const totalTasks = studentProgress.reduce((sum, p) => sum + p.completed_tasks, 0);
    const totalQuestions = studentProgress.reduce((sum, p) => sum + p.completed_questions, 0);

    return [
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first level',
        icon: Target,
        category: 'achievement',
        requirement: 1,
        currentProgress: completedLevels,
        earned: completedLevels >= 1,
        rarity: 'common'
      },
      {
        id: 'point_collector',
        name: 'Point Collector',
        description: 'Earn 1000 points total',
        icon: Star,
        category: 'achievement',
        requirement: 1000,
        currentProgress: totalPoints,
        earned: totalPoints >= 1000,
        rarity: 'rare'
      },
      {
        id: 'task_master',
        name: 'Task Master',
        description: 'Complete 50 tasks',
        icon: Trophy,
        category: 'mastery',
        requirement: 50,
        currentProgress: totalTasks,
        earned: totalTasks >= 50,
        rarity: 'epic'
      },
      {
        id: 'question_expert',
        name: 'Question Expert',
        description: 'Answer 100 questions correctly',
        icon: Zap,
        category: 'mastery',
        requirement: 100,
        currentProgress: totalQuestions,
        earned: totalQuestions >= 100,
        rarity: 'rare'
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Achieve 95% accuracy',
        icon: Crown,
        category: 'mastery',
        requirement: 95,
        currentProgress: 92, // Mock data
        earned: false,
        rarity: 'legendary'
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 7-day learning streak',
        icon: Award,
        category: 'streak',
        requirement: 7,
        currentProgress: 3, // Mock data
        earned: false,
        rarity: 'epic'
      }
    ];
  };

  const badges = calculateBadgeProgress();
  const earnedBadges = badges.filter(b => b.earned);
  const inProgressBadges = badges.filter(b => !b.earned);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-muted-foreground border-muted';
      case 'rare': return 'text-blue-500 border-blue-200';
      case 'epic': return 'text-purple-500 border-purple-200';
      case 'legendary': return 'text-yellow-500 border-yellow-200';
      default: return 'text-muted-foreground border-muted';
    }
  };

  const getThemeClasses = () => {
    switch (themeAge) {
      case 'playful':
        return 'space-y-6';
      case 'professional':
        return 'space-y-4';
      default:
        return 'space-y-6';
    }
  };

  return (
    <div className={cn("p-6", getThemeClasses())}>
      {/* Earned Badges */}
      <Card className="border-success/20 bg-success/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <Trophy className="h-5 w-5" />
            Earned Badges ({earnedBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {earnedBadges.map((badge) => {
              const IconComponent = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "p-4 rounded-lg border-2 bg-background",
                    getRarityColor(badge.rarity),
                    themeAge === 'playful' && "hover:scale-105 transition-transform"
                  )}
                >
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <IconComponent className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="font-semibold">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {badge.rarity}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          {earnedBadges.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Complete your first task to earn your first badge!
            </p>
          )}
        </CardContent>
      </Card>

      {/* In Progress Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            In Progress ({inProgressBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inProgressBadges.map((badge) => {
              const IconComponent = badge.icon;
              const progressPercentage = Math.min((badge.currentProgress / badge.requirement) * 100, 100);
              
              return (
                <div key={badge.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-6 w-6 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{badge.name}</h4>
                        <Badge variant="outline" className={cn("text-xs", getRarityColor(badge.rarity))}>
                          {badge.rarity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{badge.currentProgress}/{badge.requirement}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};