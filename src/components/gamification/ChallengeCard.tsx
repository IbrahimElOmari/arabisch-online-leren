import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Challenge {
  id: string;
  challenge_type: 'daily' | 'weekly' | 'special';
  title: string;
  description: string;
  xp_reward: number;
  valid_until: string;
  game_mode: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
  isCompleted?: boolean;
  onComplete?: (challengeId: string) => void;
  gameMode: 'SPEELS' | 'PRESTIGE';
}

export const ChallengeCard = ({ challenge, isCompleted, onComplete, gameMode }: ChallengeCardProps) => {
  const typeColors = {
    daily: 'bg-blue-500/10 text-blue-600',
    weekly: 'bg-purple-500/10 text-purple-600',
    special: 'bg-amber-500/10 text-amber-600'
  };

  const timeLeft = formatDistanceToNow(new Date(challenge.valid_until), {
    locale: nl,
    addSuffix: true
  });

  return (
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={typeColors[challenge.challenge_type]}>
                {challenge.challenge_type === 'daily' && 'Dagelijks'}
                {challenge.challenge_type === 'weekly' && 'Wekelijks'}
                {challenge.challenge_type === 'special' && 'Speciaal'}
              </Badge>
              {isCompleted && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-primary font-bold">
            <Trophy className="h-4 w-4" />
            <span>{challenge.xp_reward} XP</span>
          </div>
        </div>
        <CardDescription>{challenge.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{timeLeft}</span>
          </div>
          {!isCompleted && onComplete && (
            <Button
              size="sm"
              onClick={() => onComplete(challenge.id)}
              className={gameMode === 'SPEELS' ? 'bg-primary' : 'bg-accent'}
            >
              Voltooi
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
