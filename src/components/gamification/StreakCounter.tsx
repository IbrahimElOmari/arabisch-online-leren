
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Calendar, Clock, TrendingUp } from 'lucide-react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivity: string;
  todayCompleted: boolean;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface StreakCounterProps {
  streakData: StreakData;
}

export const StreakCounter = ({ streakData }: StreakCounterProps) => {
  const weeklyPercentage = (streakData.weeklyProgress / streakData.weeklyGoal) * 100;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Streak */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            Huidige Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {streakData.currentStreak}
          </div>
          <p className="text-xs text-muted-foreground">
            {streakData.currentStreak === 1 ? 'dag' : 'dagen'} op rij
          </p>
          {streakData.todayCompleted && (
            <Badge variant="secondary" className="mt-2 text-xs">
              ✓ Vandaag voltooid
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Longest Streak */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Langste Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {streakData.longestStreak}
          </div>
          <p className="text-xs text-muted-foreground">
            {streakData.longestStreak === 1 ? 'dag' : 'dagen'} record
          </p>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-500" />
            Week Voortgang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {streakData.weeklyProgress}/{streakData.weeklyGoal}
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round(weeklyPercentage)}% van doel
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(weeklyPercentage, 100)}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Last Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-purple-500" />
            Laatste Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium text-purple-600">
            {new Date(streakData.lastActivity).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'short'
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(streakData.lastActivity).toLocaleTimeString('nl-NL', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
