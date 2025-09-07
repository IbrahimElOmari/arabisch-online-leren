import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, CheckCircle } from 'lucide-react';
import { StudentProgress } from '@/hooks/useStudentProgress';

interface LevelProgressCardProps {
  progress: StudentProgress;
  isCurrentLevel?: boolean;
}

export const LevelProgressCard: React.FC<LevelProgressCardProps> = ({ 
  progress, 
  isCurrentLevel = false 
}) => {
  const pointsPercentage = Math.min((progress.total_points / 1000) * 100, 100);
  const pointsRemaining = Math.max(1000 - progress.total_points, 0);

  return (
    <Card className={`relative transition-all duration-300 ${
      isCurrentLevel ? 'ring-2 ring-primary shadow-lg' : ''
    } ${progress.is_completed ? 'bg-success/5 border-success' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {progress.is_completed ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : isCurrentLevel ? (
              <Target className="h-5 w-5 text-primary" />
            ) : (
              <Trophy className="h-5 w-5 text-muted-foreground" />
            )}
            {progress.niveau?.naam || `Level ${progress.niveau?.niveau_nummer}`}
          </CardTitle>
          <div className="flex gap-2">
            {progress.is_completed && (
              <Badge variant="default" className="bg-success text-success-foreground">
                Voltooid
              </Badge>
            )}
            {isCurrentLevel && !progress.is_completed && (
              <Badge variant="default">
                Huidig Level
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {progress.niveau?.beschrijving && (
          <p className="text-sm text-muted-foreground">
            {progress.niveau.beschrijving}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Voortgang naar voltooiing</span>
            <span className="text-muted-foreground">
              {progress.total_points} / 1000 punten
            </span>
          </div>
          
          <Progress 
            value={pointsPercentage} 
            className="h-3"
          />
          
          {!progress.is_completed && pointsRemaining > 0 && (
            <p className="text-xs text-muted-foreground">
              Nog {pointsRemaining} punten nodig om dit level te voltooien
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">
              {progress.completed_tasks}
            </div>
            <div className="text-xs text-muted-foreground">
              Taken voltooid
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">
              {progress.completed_questions}
            </div>
            <div className="text-xs text-muted-foreground">
              Vragen beantwoord
            </div>
          </div>
        </div>

        {progress.completed_at && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Voltooid op {new Date(progress.completed_at).toLocaleDateString('nl-NL')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};