import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  level: number;
  badges: number;
  streak: number;
  rank: number;
  change: 'up' | 'down' | 'same';
}

interface LeaderboardSystemProps {
  classId?: string;
  currentUserId: string;
}

export const LeaderboardSystem: React.FC<LeaderboardSystemProps> = ({ currentUserId }) => {
  const { themeAge } = useAgeTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  // Mock data - replace with real data from Supabase
  const generateMockLeaderboard = (): LeaderboardEntry[] => {
    const baseEntries = [
      { id: '1', name: 'Sarah Ahmed', points: 2500, level: 3, badges: 8, streak: 7 },
      { id: '2', name: 'Mohammed Ali', points: 2200, level: 3, badges: 6, streak: 5 },
      { id: '3', name: 'Fatima Hassan', points: 1800, level: 2, badges: 5, streak: 12 },
      { id: currentUserId, name: 'You', points: 1500, level: 2, badges: 4, streak: 3 },
      { id: '4', name: 'Omar Ibrahim', points: 1200, level: 2, badges: 3, streak: 2 },
      { id: '5', name: 'Aisha Rahman', points: 900, level: 1, badges: 2, streak: 1 },
    ];

    return baseEntries
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        change: Math.random() > 0.5 ? 'up' : index === 0 ? 'same' : 'down' as 'up' | 'down' | 'same'
      }))
      .sort((a, b) => b.points - a.points);
  };

  const leaderboard = generateMockLeaderboard();
  const currentUser = leaderboard.find(entry => entry.id === currentUserId);
  const topThree = leaderboard.slice(0, 3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-destructive rotate-180" />;
      default: return <div className="h-4 w-4" />;
    }
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
    <div className={cn("p-6", getThemeClasses())}>
      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">Deze Week</TabsTrigger>
          <TabsTrigger value="month">Deze Maand</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="mt-6">
          {/* Current User Position */}
          {currentUser && (
            <Card className="border-primary/20 bg-primary/5 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRankIcon(currentUser.rank)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback>JIJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Jouw Positie</div>
                      <div className="text-sm text-muted-foreground">
                        {currentUser.points} punten • Level {currentUser.level}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getChangeIcon(currentUser.change)}
                    <Badge variant="secondary">#{currentUser.rank}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top 3 Podium */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Top 3 van de klas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {topThree.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "text-center p-4 rounded-lg border",
                      entry.rank === 1 && "border-yellow-200 bg-yellow-50",
                      entry.rank === 2 && "border-gray-200 bg-gray-50",
                      entry.rank === 3 && "border-amber-200 bg-amber-50",
                      themeAge === 'playful' && "hover:scale-105 transition-transform"
                    )}
                  >
                    <div className="flex justify-center mb-2">
                      {getRankIcon(entry.rank)}
                    </div>
                    <Avatar className="h-12 w-12 mx-auto mb-2">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-sm">{entry.name}</h3>
                    <div className="text-xs text-muted-foreground mt-1">
                      {entry.points} punten
                    </div>
                    <div className="flex justify-center gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        L{entry.level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {entry.badges}🏆
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Volledige Ranglijst
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      entry.id === currentUserId && "border-primary/20 bg-primary/5",
                      "hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback className="text-xs">
                          {entry.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{entry.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Level {entry.level} • {entry.streak} dag streak
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-sm">{entry.points}</div>
                        <div className="text-xs text-muted-foreground">punten</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getChangeIcon(entry.change)}
                        <Badge variant="outline" className="text-xs">
                          {entry.badges}🏆
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};