import { Card, CardContent } from '@/components/ui/card';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Award } from 'lucide-react';

interface Badge {
  id: string;
  badge_id?: string;
  badge_key?: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned_at?: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  gameMode: 'SPEELS' | 'PRESTIGE';
}

const tierColors = {
  bronze: 'from-orange-400 to-orange-600',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-blue-600'
};

export const BadgeDisplay = ({ badges, gameMode }: BadgeDisplayProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map((badge) => (
        <Card 
          key={badge.id}
          className="relative overflow-hidden hover:scale-105 transition-transform"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${tierColors[badge.badge_tier]} opacity-10`} />
          <CardContent className="p-4 text-center space-y-2">
            <div className="text-4xl mb-2">{badge.badge_icon}</div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-foreground">{badge.badge_name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {badge.badge_description}
              </p>
              <BadgeUI 
                variant="secondary" 
                className={`text-xs ${gameMode === 'SPEELS' ? 'bg-primary/10' : 'bg-accent/10'}`}
              >
                <Award className="h-3 w-3 mr-1" />
                {badge.badge_tier}
              </BadgeUI>
            </div>
          </CardContent>
        </Card>
      ))}
      {badges.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nog geen badges verdiend. Blijf actief om badges te verdienen!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
