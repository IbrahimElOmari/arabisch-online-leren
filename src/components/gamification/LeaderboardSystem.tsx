
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Users, Calendar } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  rank: number;
  streak: number;
  coursesCompleted: number;
  level: number;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  currentUserId: string;
  timeframe: 'week' | 'month' | 'all';
}

export const LeaderboardSystem = ({ users, currentUserId, timeframe }: LeaderboardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        2: 'bg-gray-100 text-gray-800 border-gray-200',
        3: 'bg-amber-100 text-amber-800 border-amber-200'
      };
      return colors[rank as keyof typeof colors];
    }
    return 'bg-muted text-muted-foreground';
  };

  const currentUser = users.find(u => u.id === currentUserId);
  const topUsers = users.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Current User Stats */}
      {currentUser && currentUser.rank > 3 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Jouw Positie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(currentUser.rank)}
                </div>
                <Avatar>
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Niveau {currentUser.level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{currentUser.points.toLocaleString()} XP</p>
                <Badge className={getRankBadge(currentUser.rank)}>
                  #{currentUser.rank}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">
            <Trophy className="h-4 w-4 mr-2" />
            Algemeen
          </TabsTrigger>
          <TabsTrigger value="streak">
            <Calendar className="h-4 w-4 mr-2" />
            Streak
          </TabsTrigger>
          <TabsTrigger value="courses">
            <Award className="h-4 w-4 mr-2" />
            Cursussen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overall">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Leerlingen - {timeframe === 'week' ? 'Deze Week' : timeframe === 'month' ? 'Deze Maand' : 'Alle Tijd'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      user.id === currentUserId 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(user.rank)}
                      </div>
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Niveau {user.level} • {user.coursesCompleted} cursussen voltooid
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{user.points.toLocaleString()} XP</p>
                      <Badge className={getRankBadge(user.rank)} variant="outline">
                        #{user.rank}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streak">
          <Card>
            <CardHeader>
              <CardTitle>Longest Streaks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users
                  .sort((a, b) => b.streak - a.streak)
                  .slice(0, 10)
                  .map((user, index) => (
                    <div
                      key={`streak-${user.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground">#{index + 1}</span>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <Badge variant="secondary">
                        🔥 {user.streak} dagen
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Meeste Cursussen Voltooid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users
                  .sort((a, b) => b.coursesCompleted - a.coursesCompleted)
                  .slice(0, 10)
                  .map((user, index) => (
                    <div
                      key={`courses-${user.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground">#{index + 1}</span>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <Badge variant="secondary">
                        📚 {user.coursesCompleted} cursussen
                      </Badge>
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
