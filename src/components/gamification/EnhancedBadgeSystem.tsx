import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Zap, Crown, Medal, Sparkles } from 'lucide-react';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';
import { useEnhancedProgress, type AwardedBadge, type EnhancedStudentProgress } from '@/hooks/useEnhancedProgress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedBadgeSystemProps {
  userId: string;
  niveauId?: string;
  showOnlyCurrentLevel?: boolean;
}

export const EnhancedBadgeSystem = ({ 
  userId, 
  niveauId, 
  showOnlyCurrentLevel = false 
}: EnhancedBadgeSystemProps) => {
  const { themeAge } = useAgeTheme();
  const { progress, refreshProgress } = useEnhancedProgress(userId);
  const { toast } = useToast();
  const [newBadgeAnimation, setNewBadgeAnimation] = useState<string | null>(null);

  // Filter progress based on current level if specified
  const relevantProgress = showOnlyCurrentLevel && niveauId 
    ? progress.filter(p => p.niveau_id === niveauId)
    : progress;
  
  // Generate potential badges for current progress
  const generatePotentialBadges = (progressData: EnhancedStudentProgress[]) => {
    const badges: Array<{
      id: string;
      name: string;
      description: string;
      icon: React.ComponentType<any>;
      requirement: number;
      currentProgress: number;
      earned: boolean;
      earnedAt?: string;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
      niveauName?: string;
    }> = [];

    progressData.forEach(progress => {
      const totalPoints = progress.total_points_with_bonus || 0;
      const niveauName = progress.niveau?.naam || 'Onbekend Niveau';

      // Point milestone badges (100, 200, ..., 1000)
      for (let milestone = 100; milestone <= 1000; milestone += 100) {
        const existingBadge = progress.earned_badges?.find(b => b.badge_id === `points_${milestone}`);
        
        badges.push({
          id: `${progress.niveau_id}_points_${milestone}`,
          name: `${milestone} Punten`,
          description: `Verdien ${milestone} punten in ${niveauName}`,
          icon: milestone === 1000 ? Crown : milestone >= 500 ? Medal : Star,
          requirement: milestone,
          currentProgress: totalPoints,
          earned: !!existingBadge,
          earnedAt: existingBadge?.earned_at,
          rarity: milestone === 1000 ? 'legendary' : milestone >= 700 ? 'epic' : milestone >= 400 ? 'rare' : 'common',
          niveauName
        });
      }

      // Task completion badges
      if (progress.completed_tasks >= 10) {
        badges.push({
          id: `${progress.niveau_id}_task_master`,
          name: 'Taak Meester',
          description: `10 taken voltooid in ${niveauName}`,
          icon: Trophy,
          requirement: 10,
          currentProgress: progress.completed_tasks,
          earned: progress.completed_tasks >= 10,
          rarity: 'rare',
          niveauName
        });
      }

      // Question answering badges
      if (progress.completed_questions >= 25) {
        badges.push({
          id: `${progress.niveau_id}_question_expert`,
          name: 'Vraag Expert',
          description: `25 vragen beantwoord in ${niveauName}`,
          icon: Zap,
          requirement: 25,
          currentProgress: progress.completed_questions,
          earned: progress.completed_questions >= 25,
          rarity: 'rare',
          niveauName
        });
      }
    });

    return badges.sort((a, b) => {
      // Sort by earned status, then by rarity, then by progress
      if (a.earned !== b.earned) return a.earned ? -1 : 1;
      const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    });
  };

  const badges = generatePotentialBadges(relevantProgress);
  const earnedBadges = badges.filter(b => b.earned);
  const inProgressBadges = badges.filter(b => !b.earned && b.currentProgress > 0);

  // Listen for new badge notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('badge-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'awarded_badges',
          filter: `student_id=eq.${userId}`
        },
        (payload) => {
          const newBadge = payload.new as AwardedBadge;
          setNewBadgeAnimation(newBadge.badge_id);
          
          // Show celebration toast
          toast({
            title: "🎉 Nieuwe Badge Verdiend!",
            description: `${newBadge.badge_name}: ${newBadge.badge_description}`,
            duration: 5000,
          });

          // Refresh progress to get updated data
          refreshProgress();
          
          // Clear animation after 3 seconds
          setTimeout(() => setNewBadgeAnimation(null), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshProgress, toast]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-muted-foreground border-muted-foreground/20';
      case 'rare': return 'text-blue-500 border-blue-500/20 bg-blue-50 dark:bg-blue-950/20';
      case 'epic': return 'text-purple-500 border-purple-500/20 bg-purple-50 dark:bg-purple-950/20';
      case 'legendary': return 'text-amber-500 border-amber-500/20 bg-amber-50 dark:bg-amber-950/20';
      default: return 'text-muted-foreground border-muted';
    }
  };

  const getRarityAnimation = (badgeId: string) => {
    return newBadgeAnimation === badgeId ? 'animate-bounce' : '';
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
    <div className={cn("space-y-6", getThemeClasses())}>
      {/* Earned Badges */}
      <Card className="border-success/20 bg-success/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <Trophy className="h-5 w-5" />
            Verdiende Badges ({earnedBadges.length})
            {newBadgeAnimation && <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />}
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
                    "p-4 rounded-lg border-2 transition-all duration-300",
                    getRarityColor(badge.rarity),
                    getRarityAnimation(badge.id.split('_').pop()!),
                    themeAge === 'playful' && "hover:scale-105"
                  )}
                >
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <IconComponent className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="font-semibold">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    {badge.niveauName && (
                      <Badge variant="outline" className="text-xs">
                        {badge.niveauName}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {badge.rarity}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          {earnedBadges.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Voltooi je eerste taak om je eerste badge te verdienen!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* In Progress Badges */}
      {inProgressBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              In Voortgang ({inProgressBadges.length})
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
                          <div className="flex gap-2">
                            {badge.niveauName && (
                              <Badge variant="outline" className="text-xs">
                                {badge.niveauName}
                              </Badge>
                            )}
                            <Badge variant="outline" className={cn("text-xs", getRarityColor(badge.rarity))}>
                              {badge.rarity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Voortgang</span>
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
      )}
    </div>
  );
};