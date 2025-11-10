import { Card, CardContent } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface StreakDisplayProps {
  streakDays: number;
  gameMode: 'SPEELS' | 'PRESTIGE';
}

export const StreakDisplay = ({ streakDays, gameMode }: StreakDisplayProps) => {
  return (
    <Card className={gameMode === 'SPEELS' ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full ${gameMode === 'SPEELS' ? 'bg-orange-500' : 'bg-accent'}`}>
            <Flame className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Huidige streak</p>
            <p className="text-3xl font-bold text-foreground">
              {streakDays} {streakDays === 1 ? 'dag' : 'dagen'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {streakDays === 0 ? 'Begin vandaag je streak!' : 'Blijf actief om je streak te behouden!'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
