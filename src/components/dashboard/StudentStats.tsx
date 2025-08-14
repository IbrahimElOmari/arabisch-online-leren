
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Clock, Star } from 'lucide-react';

interface StudentStatsProps {
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  studyTime: number;
  currentStreak: number;
}

export const StudentStats = ({ 
  completedLessons, 
  totalLessons, 
  averageScore, 
  studyTime, 
  currentStreak 
}: StudentStatsProps) => {
  const progressPercentage = (completedLessons / totalLessons) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Voortgang</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {completedLessons}/{totalLessons}
              </p>
            </div>
          </div>
          <Progress value={progressPercentage} className="mt-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(progressPercentage)}% voltooid
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gemiddelde Score</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {averageScore}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= Math.floor(averageScore / 20)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Studietijd</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {studyTime}h
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Deze week
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {currentStreak}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2 bg-orange-100 text-orange-700">
            🔥 Op een rij!
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
