
import { Trophy, Award, Star, Medal, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type AwardedBadge } from '@/services/gamificationService';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface BadgeWallProps {
  badges: AwardedBadge[];
  showAll?: boolean;
  className?: string;
}

export function BadgeWall({ badges, showAll = false, className }: BadgeWallProps) {
  const { isRTL } = useRTLLayout();

  const getBadgeIcon = (badgeId: string, badgeType: string) => {
    if (badgeType === 'automatic') {
      if (badgeId.includes('points_1000')) return <Crown className="h-6 w-6" />;
      if (badgeId.includes('points_')) return <Trophy className="h-6 w-6" />;
      if (badgeId.includes('streak')) return <Star className="h-6 w-6" />;
    }
    
    // Default icons based on badge name keywords
    const name = badges.find(b => b.badge_id === badgeId)?.badge_name.toLowerCase() || '';
    if (name.includes('perfect') || name.includes('100')) return <Crown className="h-6 w-6" />;
    if (name.includes('help') || name.includes('hulp')) return <Award className="h-6 w-6" />;
    if (name.includes('discuss') || name.includes('forum')) return <Medal className="h-6 w-6" />;
    if (name.includes('early') || name.includes('vroeg')) return <Star className="h-6 w-6" />;
    
    return <Trophy className="h-6 w-6" />;
  };

  const getBadgeColor = (badgeType: string, pointsThreshold?: number) => {
    if (badgeType === 'automatic') {
      if (pointsThreshold && pointsThreshold >= 1000) return 'from-yellow-400 to-yellow-600';
      if (pointsThreshold && pointsThreshold >= 500) return 'from-purple-400 to-purple-600';
      if (pointsThreshold && pointsThreshold >= 100) return 'from-blue-400 to-blue-600';
    }
    
    if (badgeType === 'manual') return 'from-green-400 to-green-600';
    
    return 'from-gray-400 to-gray-600';
  };

  const displayBadges = showAll ? badges : badges.slice(0, 6);
  const groupedBadges = displayBadges.reduce((groups, badge) => {
    const type = badge.badge_type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(badge);
    return groups;
  }, {} as Record<string, AwardedBadge[]>);

  if (badges.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", isRTL && "arabic-text")}>
            <Trophy className="h-5 w-5" />
            Badge Wall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className={cn(isRTL && "arabic-text")}>
              Nog geen badges behaald. Voltooi opdrachten en deel in het forum om badges te verdienen!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", isRTL && "arabic-text")}>
          <Trophy className="h-5 w-5" />
          Badge Wall
          <Badge variant="secondary" className="ms-auto">
            {badges.length} badges
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className={cn(showAll ? "h-96" : "h-auto")}>
          <div className="space-y-6">
            {Object.entries(groupedBadges).map(([type, typeBadges]) => (
              <div key={type}>
                <h4 className={cn(
                  "text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide",
                  isRTL && "arabic-text"
                )}>
                  {type === 'automatic' ? 'Automatische Badges' : 'Speciale Erkenning'}
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {typeBadges.map((badge) => (
                    <Tooltip key={badge.id}>
                      <TooltipTrigger>
                        <div className={cn(
                          "relative group cursor-pointer",
                          "transform transition-all duration-200 hover:scale-105"
                        )}>
                          {/* Badge container */}
                          <div className={cn(
                            "relative w-16 h-16 mx-auto mb-2",
                            "bg-gradient-to-br rounded-full",
                            "border-2 border-white shadow-lg",
                            "flex items-center justify-center text-white",
                            getBadgeColor(badge.badge_type, badge.points_threshold)
                          )}>
                            {getBadgeIcon(badge.badge_id, badge.badge_type)}
                            
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          {/* Badge name */}
                          <div className="text-center">
                            <p className={cn(
                              "text-xs font-medium line-clamp-2 h-8",
                              isRTL && "arabic-text"
                            )}>
                              {badge.badge_name}
                            </p>
                          </div>
                          
                          {/* Recently earned indicator */}
                          {new Date().getTime() - new Date(badge.earned_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                            <div className="absolute -top-1 -right-1">
                              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      
                      <TooltipContent>
                        <div className="max-w-xs p-2">
                          <h5 className="font-semibold mb-1">{badge.badge_name}</h5>
                          <p className="text-sm text-muted-foreground mb-2">
                            {badge.badge_description}
                          </p>
                          
                          {badge.reason && (
                            <p className="text-xs text-muted-foreground mb-2">
                              <strong>Reden:</strong> {badge.reason}
                            </p>
                          )}
                          
                          {badge.points_threshold && (
                            <p className="text-xs text-muted-foreground mb-2">
                              <strong>Vereiste punten:</strong> {badge.points_threshold}
                            </p>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Behaald {formatDistanceToNow(new Date(badge.earned_at), { 
                              addSuffix: true, 
                              locale: nl 
                            })}
                          </p>
                          
                          {badge.awarded_by && badge.badge_type === 'manual' && (
                            <p className="text-xs text-muted-foreground">
                              Toegekend door leerkracht
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {!showAll && badges.length > 6 && (
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                En nog {badges.length - 6} badges meer...
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}