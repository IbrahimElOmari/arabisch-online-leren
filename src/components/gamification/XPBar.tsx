import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

interface XPBarProps {
  currentXP: number;
  level: number;
  gameMode: 'SPEELS' | 'PRESTIGE';
}

export const XPBar = ({ currentXP, level, gameMode }: XPBarProps) => {
  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const xpInLevel = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progress = (xpInLevel / xpNeeded) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className={gameMode === 'SPEELS' ? 'h-5 w-5 text-primary' : 'h-5 w-5 text-accent'} />
          <span className="text-sm font-medium text-foreground">
            Level {level}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {xpInLevel} / {xpNeeded} XP
        </span>
      </div>
      <Progress 
        value={progress} 
        className={gameMode === 'SPEELS' ? 'h-3' : 'h-2'}
      />
    </div>
  );
};
