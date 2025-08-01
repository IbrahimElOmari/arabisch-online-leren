import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock, Play } from 'lucide-react';

export interface LevelData {
  id: string;
  name: string;
  isCompleted: boolean;
  isAccessible: boolean;
  currentLesson?: number;
  totalLessons?: number;
}

interface LevelOverviewProps {
  classId: string;
  className: string;
  levels: LevelData[];
  onLevelClick: (levelId: string) => void;
}

export const LevelOverview = ({ classId, className, levels, onLevelClick }: LevelOverviewProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{className}</h2>
        <p className="text-muted-foreground">Kies een niveau om verder te gaan</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {levels.map((level) => (
          <Card 
            key={level.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              !level.isAccessible 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:scale-105'
            } ${level.isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}
            onClick={() => level.isAccessible && onLevelClick(level.id)}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                {level.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : !level.isAccessible ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Play className="h-5 w-5 text-primary" />
                )}
                {level.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {level.isCompleted && (
                <Badge variant="secondary" className="mb-2 bg-green-100 text-green-800">
                  Voltooid
                </Badge>
              )}
              {level.currentLesson && level.totalLessons && (
                <p className="text-sm text-muted-foreground">
                  Les {level.currentLesson} van {level.totalLessons}
                </p>
              )}
              {!level.isAccessible && (
                <Badge variant="outline" className="text-muted-foreground">
                  Vergrendeld
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};